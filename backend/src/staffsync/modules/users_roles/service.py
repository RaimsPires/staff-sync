from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import func
from sqlmodel import select

from staffsync.common.enums import Perm, ScopeType
from staffsync.core.adapters import notify
from staffsync.core.audit import audit
from staffsync.core.config import get_settings
from staffsync.core.context import RequestContext
from staffsync.core.errors import BusinessRule, Conflict, Forbidden, NotFound, ValidationFailed
from staffsync.core.i18n import gettext_, recipient_locale
from staffsync.core.security import new_opaque_token, sha256
from staffsync.modules.auth.models import CompanyMember, Invitation, User
from staffsync.modules.auth.tokens import revoke_user_sessions
from staffsync.modules.branches.models import Branch
from staffsync.modules.sites.models import Site
from staffsync.modules.users_roles.models import Role, RolePermission, UserRole
from staffsync.modules.users_roles.schemas import InviteIn, PreviewIn, RoleCreate, RoleRead, RoleUpdate, ScopeIn, UserRead

MODULES = {
    "attendance": [Perm.ATTENDANCE_VIEW, Perm.ATTENDANCE_EDIT, Perm.ATTENDANCE_PROXY],
    "alerts": [Perm.ALERTS_VIEW, Perm.ALERTS_RESOLVE],
    "employees": [Perm.EMPLOYEES_VIEW, Perm.EMPLOYEES_MANAGE, Perm.DEVICES_RESET],
    "sites": [Perm.SITES_VIEW, Perm.SITES_MANAGE],
    "branches": [Perm.BRANCHES_VIEW, Perm.BRANCHES_MANAGE],
    "schedules": [Perm.SCHEDULES_VIEW, Perm.SCHEDULES_MANAGE],
    "leave": [Perm.LEAVE_VIEW, Perm.LEAVE_RECOMMEND, Perm.LEAVE_APPROVE, Perm.LEAVE_SETTINGS],
    "reports": [Perm.REPORTS_VIEW, Perm.REPORTS_EXPORT],
    "users": [Perm.USERS_MANAGE, Perm.ROLES_MANAGE],
    "audit": [Perm.AUDIT_VIEW],
    "settings": [Perm.SETTINGS_MANAGE],
    "billing": [Perm.BILLING_MANAGE],
}


def catalogue() -> list[dict]:
    return [{"module": m, "permissions": [p.value for p in ps]} for m, ps in MODULES.items()]


async def _role_read(ctx: RequestContext, roles: list[Role]) -> list[RoleRead]:
    ids = [r.id for r in roles]
    perms: dict[UUID, list[str]] = {i: [] for i in ids}
    counts: dict[UUID, int] = {}
    if ids:
        for rid, perm in (await ctx.session.exec(select(RolePermission.role_id, RolePermission.permission).where(RolePermission.role_id.in_(ids)))).all():  # type: ignore[attr-defined]
            perms[rid].append(perm)
        counts = dict((await ctx.session.exec(select(UserRole.role_id, func.count()).where(UserRole.role_id.in_(ids)).group_by(UserRole.role_id))).all())  # type: ignore[attr-defined]
    return [RoleRead(id=r.id, name=r.name, description=r.description, is_system=r.is_system, key=r.key, permissions=sorted(perms[r.id]), users_count=counts.get(r.id, 0)) for r in roles]


async def list_roles(ctx: RequestContext, only_deleted: bool = False) -> list[RoleRead]:
    stmt = select(Role).where(Role.company_id == ctx.company_id).order_by(Role.is_system.desc(), Role.name)  # type: ignore[attr-defined]
    if only_deleted:
        stmt = select(Role).where(Role.company_id == ctx.company_id, Role.deleted_at.is_not(None)).execution_options(include_deleted=True)  # type: ignore[attr-defined]
    return await _role_read(ctx, list((await ctx.session.exec(stmt)).all()))


async def get_role(ctx: RequestContext, role_id: UUID, include_deleted: bool = False) -> Role:
    stmt = select(Role).where(Role.id == role_id, Role.company_id == ctx.company_id)
    if include_deleted:
        stmt = stmt.execution_options(include_deleted=True)
    role = (await ctx.session.exec(stmt)).first()
    if role is None:
        raise NotFound()
    return role


def _cannot_exceed(ctx: RequestContext, perms: list[Perm] | set[str]) -> None:
    missing = {p.value if isinstance(p, Perm) else p for p in perms} - set(ctx.perms)
    if missing:
        raise Forbidden("You cannot grant permissions you do not hold", code="PRIVILEGE_ESCALATION", missing=sorted(missing))


async def create_role(ctx: RequestContext, body: RoleCreate) -> RoleRead:
    _cannot_exceed(ctx, body.permissions)
    role = Role(company_id=ctx.company_id, name=body.name, description=body.description)
    ctx.session.add(role)
    try:
        await ctx.session.flush()
    except Exception as exc:
        raise Conflict("A role with this name already exists", code="NAME_TAKEN") from exc
    for p in dict.fromkeys(body.permissions):
        ctx.session.add(RolePermission(role_id=role.id, permission=p.value))
    audit(ctx, "role.created", "role", role.id, after={"name": role.name, "permissions": [p.value for p in body.permissions]})
    await ctx.session.flush()
    return (await _role_read(ctx, [role]))[0]


async def update_role(ctx: RequestContext, role: Role, body: RoleUpdate) -> RoleRead:
    if role.is_system:
        raise Conflict("System roles are locked", code="SYSTEM_ROLE")
    before = (await _role_read(ctx, [role]))[0].model_dump(mode="json")
    if body.name is not None:
        role.name = body.name
    if body.description is not None:
        role.description = body.description
    if body.permissions is not None:
        _cannot_exceed(ctx, body.permissions)
        for rp in (await ctx.session.exec(select(RolePermission).where(RolePermission.role_id == role.id))).all():
            await ctx.session.delete(rp)
        await ctx.session.flush()
        for p in dict.fromkeys(body.permissions):
            ctx.session.add(RolePermission(role_id=role.id, permission=p.value))
    ctx.session.add(role)
    await ctx.session.flush()
    after = (await _role_read(ctx, [role]))[0]
    audit(ctx, "role.updated", "role", role.id, before=before, after=after)
    return after


async def delete_role(ctx: RequestContext, role: Role, reason: str) -> None:
    from staffsync.common.softdelete import soft_delete

    if role.is_system:
        raise Conflict("System roles cannot be deleted", code="SYSTEM_ROLE")
    n = (await ctx.session.exec(select(func.count()).select_from(UserRole).where(UserRole.role_id == role.id))).one()
    if n:
        raise Conflict(f"{n} user(s) hold this role", code="ROLE_IN_USE", count=n)
    soft_delete(ctx, role, reason, entity="role")


async def _validate_scope(ctx: RequestContext, scope: ScopeIn) -> None:
    st = scope.scope_type
    if st in (ScopeType.BRANCHES, ScopeType.SITES) and not scope.scope_ids:
        raise ValidationFailed("Select at least one branch or site")
    model = Branch if st is ScopeType.BRANCHES else Site if st is ScopeType.SITES else None
    if model is not None:
        n = (await ctx.session.exec(select(func.count()).select_from(model).where(model.id.in_(scope.scope_ids), model.company_id == ctx.company_id))).one()  # type: ignore[attr-defined]
        if n != len(set(scope.scope_ids)):
            raise ValidationFailed("Unknown branch or site in scope")
    # cannot grant a wider scope than your own
    if ctx.scope.site_ids is not None:
        if st is ScopeType.COMPANY:
            raise Forbidden("You cannot grant company-wide scope", code="PRIVILEGE_ESCALATION")
        if st is ScopeType.BRANCHES and ctx.scope.branch_ids is not None and not set(scope.scope_ids) <= set(ctx.scope.branch_ids):
            raise Forbidden("Branch outside your scope", code="PRIVILEGE_ESCALATION")
        if st is ScopeType.SITES and not set(scope.scope_ids) <= set(ctx.scope.site_ids):
            raise Forbidden("Site outside your scope", code="PRIVILEGE_ESCALATION")


async def _role_perms(ctx: RequestContext, role: Role) -> set[str]:
    return set((await ctx.session.exec(select(RolePermission.permission).where(RolePermission.role_id == role.id))).all())


async def list_users(ctx: RequestContext) -> list[UserRead]:
    rows = (await ctx.session.exec(select(CompanyMember, User).join(User, User.id == CompanyMember.user_id).where(CompanyMember.company_id == ctx.company_id))).all()
    out = []
    for m, u in rows:
        rs = (await ctx.session.exec(select(UserRole, Role).join(Role, Role.id == UserRole.role_id).where(UserRole.user_id == u.id, UserRole.company_id == ctx.company_id))).all()
        if not rs:
            continue  # employees without dashboard access are listed under /employees
        out.append(UserRead(id=u.id, full_name=u.full_name, email=u.email, status=m.status, roles=[{"role_id": r.id, "role": r.name, "scope_type": ur.scope_type, "scope_ids": ur.scope_ids} for ur, r in rs],
                            last_active_at=m.last_active_at.isoformat() if m.last_active_at else None))
    # People whose dashboard access was revoked stay listed (with no role) so it can be given back.
    gone = (await ctx.session.exec(select(CompanyMember, User).join(User, User.id == CompanyMember.user_id).where(CompanyMember.company_id == ctx.company_id, CompanyMember.status == "revoked").execution_options(include_deleted=True))).all()  # type: ignore[attr-defined]
    listed = {o.id for o in out}
    for m, u in gone:
        if u.id not in listed:
            out.append(UserRead(id=u.id, full_name=u.full_name, email=u.email, status="revoked", roles=[], last_active_at=m.last_active_at.isoformat() if m.last_active_at else None))
    return out


async def invite_user(ctx: RequestContext, body: InviteIn) -> dict:
    role = await get_role(ctx, body.role_id)
    _cannot_exceed(ctx, await _role_perms(ctx, role))
    await _validate_scope(ctx, body)
    email = body.email.lower()
    user = (await ctx.session.exec(select(User).where(User.email == email))).first()
    if user is None:
        user = User(full_name=body.full_name, email=email)
        ctx.session.add(user)
        await ctx.session.flush()
    member = (await ctx.session.exec(select(CompanyMember).where(CompanyMember.company_id == ctx.company_id, CompanyMember.user_id == user.id))).first()
    if member and member.status == "active" and (await ctx.session.exec(select(UserRole).where(UserRole.user_id == user.id, UserRole.company_id == ctx.company_id))).first():
        raise Conflict("This person already has dashboard access", code="ALREADY_MEMBER")
    if member is None:
        ctx.session.add(CompanyMember(company_id=ctx.company_id, user_id=user.id, status="invited"))
    ctx.session.add(UserRole(company_id=ctx.company_id, user_id=user.id, role_id=role.id, scope_type=body.scope_type.value, scope_ids=body.scope_ids))
    token = new_opaque_token()
    ctx.session.add(Invitation(company_id=ctx.company_id, user_id=user.id, token_hash=sha256(token), role_id=role.id, scope_type=body.scope_type.value,
                               invited_by=ctx.user.id, message=body.message, expires_at=datetime.now(UTC) + timedelta(days=7)))
    link = f"{get_settings().dashboard_url}/invite/{token}"
    lang = recipient_locale(user.locale)
    await notify("email", email, gettext_("%(name)s invited you to StaffSync: %(link)s", lang, name=ctx.user.full_name, link=link), subject=gettext_("You're invited", lang), token=token, link=link)
    audit(ctx, "user.invited", "user", user.id, after={"email": email, "role": role.name})
    return {"user_id": user.id, "status": "invited"}


async def resend_invite(ctx: RequestContext, user_id: UUID) -> None:
    """Send a fresh link to someone who has not accepted yet; earlier links stop working."""
    member = (await ctx.session.exec(select(CompanyMember).where(CompanyMember.company_id == ctx.company_id, CompanyMember.user_id == user_id, CompanyMember.status == "invited"))).first()
    user = await ctx.session.get(User, user_id)
    if member is None or user is None:
        raise NotFound()
    pending = (await ctx.session.exec(select(Invitation).where(Invitation.company_id == ctx.company_id, Invitation.user_id == user_id, Invitation.accepted_at.is_(None)).order_by(Invitation.created_at.desc()))).all()  # type: ignore[union-attr]
    if not pending:
        raise NotFound()
    last = pending[0]
    for old in pending:
        old.expires_at = datetime.now(UTC)
        ctx.session.add(old)
    token = new_opaque_token()
    ctx.session.add(Invitation(company_id=ctx.company_id, user_id=user_id, token_hash=sha256(token), role_id=last.role_id, scope_type=last.scope_type, scope_ids=last.scope_ids,
                               invited_by=ctx.user.id, message=last.message, expires_at=datetime.now(UTC) + timedelta(days=7)))
    link = f"{get_settings().dashboard_url}/invite/{token}"
    lang = recipient_locale(user.locale)
    await notify("email", user.email, gettext_("%(name)s invited you to StaffSync: %(link)s", lang, name=ctx.user.full_name, link=link), subject=gettext_("You're invited", lang), token=token, link=link)
    audit(ctx, "user.invite_resent", "user", user_id, after={"email": user.email})


async def change_roles(ctx: RequestContext, user_id: UUID, role_id: UUID, scope: ScopeIn) -> None:
    role = await get_role(ctx, role_id)
    _cannot_exceed(ctx, await _role_perms(ctx, role))
    await _validate_scope(ctx, scope)
    existing = (await ctx.session.exec(select(UserRole).where(UserRole.user_id == user_id, UserRole.company_id == ctx.company_id))).all()
    if not existing:
        raise NotFound()
    owner_role = (await ctx.session.exec(select(Role).where(Role.company_id == ctx.company_id, Role.key == "owner"))).first()
    if owner_role and any(e.role_id == owner_role.id for e in existing) and role.id != owner_role.id:
        owners = (await ctx.session.exec(select(func.count()).select_from(UserRole).where(UserRole.role_id == owner_role.id))).one()
        if owners <= 1:
            raise BusinessRule("The company needs at least one owner", code="LAST_OWNER")
    before = [{"role_id": str(e.role_id), "scope_type": e.scope_type} for e in existing]
    for e in existing:
        await ctx.session.delete(e)
    await ctx.session.flush()
    ctx.session.add(UserRole(company_id=ctx.company_id, user_id=user_id, role_id=role.id, scope_type=scope.scope_type.value, scope_ids=scope.scope_ids))
    audit(ctx, "user.roles_changed", "user", user_id, before=before, after={"role": role.name, "scope_type": scope.scope_type.value})


async def restore_user(ctx: RequestContext, user_id: UUID, role_id: UUID, scope: ScopeIn) -> None:
    """Give a revoked person dashboard access again, with a role and scope chosen now."""
    member = (await ctx.session.exec(select(CompanyMember).where(CompanyMember.user_id == user_id, CompanyMember.company_id == ctx.company_id, CompanyMember.status == "revoked").execution_options(include_deleted=True))).first()  # type: ignore[attr-defined]
    if member is None:
        raise NotFound()
    role = await get_role(ctx, role_id)
    _cannot_exceed(ctx, await _role_perms(ctx, role))
    await _validate_scope(ctx, scope)
    member.status, member.deleted_at, member.deleted_by = "active", None, None
    ctx.session.add(member)
    ctx.session.add(UserRole(company_id=ctx.company_id, user_id=user_id, role_id=role.id, scope_type=scope.scope_type.value, scope_ids=scope.scope_ids))
    audit(ctx, "user.access_restored", "user", user_id, after={"role": role.name, "scope_type": scope.scope_type.value})


async def revoke_user(ctx: RequestContext, user_id: UUID) -> None:
    if user_id == ctx.user.id:
        raise BusinessRule("You cannot revoke your own access", code="SELF_REVOKE")
    rows = (await ctx.session.exec(select(UserRole).where(UserRole.user_id == user_id, UserRole.company_id == ctx.company_id))).all()
    if not rows:
        raise NotFound()
    owner_role = (await ctx.session.exec(select(Role).where(Role.company_id == ctx.company_id, Role.key == "owner"))).first()
    if owner_role and any(r.role_id == owner_role.id for r in rows):
        owners = (await ctx.session.exec(select(func.count()).select_from(UserRole).where(UserRole.role_id == owner_role.id))).one()
        if owners <= 1:
            raise BusinessRule("The company needs at least one owner", code="LAST_OWNER")
    for r in rows:
        await ctx.session.delete(r)
    still_employee = False
    from staffsync.modules.employees.models import Employee

    still_employee = (await ctx.session.exec(select(Employee).where(Employee.user_id == user_id, Employee.company_id == ctx.company_id, Employee.status != "deactivated"))).first() is not None
    if not still_employee:
        member = (await ctx.session.exec(select(CompanyMember).where(CompanyMember.user_id == user_id, CompanyMember.company_id == ctx.company_id))).first()
        if member:
            member.status = "revoked"
            member.deleted_at = datetime.now(UTC)
            member.deleted_by = ctx.user.id
    await revoke_user_sessions(ctx.session, user_id, company_id=ctx.company_id)
    audit(ctx, "user.access_revoked", "user", user_id)


async def preview(ctx: RequestContext, body: PreviewIn) -> dict:
    """What a permission + scope set would see: counts of branches and sites inside the scope."""
    await _validate_scope(ctx, body)
    st = body.scope_type
    if st is ScopeType.COMPANY:
        sites = (await ctx.session.exec(select(func.count()).select_from(Site).where(Site.company_id == ctx.company_id))).one()
        branches = (await ctx.session.exec(select(func.count()).select_from(Branch).where(Branch.company_id == ctx.company_id))).one()
    elif st is ScopeType.BRANCHES:
        branches = len(set(body.scope_ids))
        sites = (await ctx.session.exec(select(func.count()).select_from(Site).where(Site.branch_id.in_(body.scope_ids)))).one()  # type: ignore[attr-defined]
    elif st is ScopeType.SITES:
        branches, sites = 0, len(set(body.scope_ids))
    else:
        branches, sites = 0, 0
    return {"permissions": sorted(p.value for p in body.permissions), "scope_type": st.value, "branches": branches, "sites": sites}
