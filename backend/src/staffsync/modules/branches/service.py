from uuid import UUID
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from staffsync.common.repository import TenantRepository
from staffsync.common.softdelete import restore, soft_delete
from staffsync.core.audit import audit
from staffsync.core.context import RequestContext
from staffsync.core.errors import Conflict, ValidationFailed
from staffsync.modules.branches.models import Branch
from staffsync.modules.branches.schemas import BranchCreate, BranchRead, BranchUpdate
from staffsync.modules.employees.models import Employee
from staffsync.modules.sites.models import Site
from staffsync.modules.users_roles.models import Role, UserRole


class BranchRepository(TenantRepository[Branch]):
    model = Branch

    def scope(self, stmt):
        if self.ctx.scope.branch_ids is None:
            return stmt
        allowed = set(self.ctx.scope.branch_ids)
        return stmt.where(Branch.id.in_(allowed)) if allowed else stmt.where(Branch.id.is_(None))


def _tz(name: str) -> None:
    try:
        ZoneInfo(name)
    except ZoneInfoNotFoundError as exc:
        raise ValidationFailed("Unknown timezone") from exc


async def counts(ctx: RequestContext, branch_ids: list[UUID]) -> dict[UUID, tuple[int, int]]:
    sites = dict((await ctx.session.exec(select(Site.branch_id, func.count()).where(Site.branch_id.in_(branch_ids), Site.status == "active").group_by(Site.branch_id))).all())  # type: ignore[attr-defined]
    emps = dict((await ctx.session.exec(select(Employee.branch_id, func.count()).where(Employee.branch_id.in_(branch_ids), Employee.status != "deactivated").group_by(Employee.branch_id))).all())  # type: ignore[attr-defined]
    return {b: (sites.get(b, 0), emps.get(b, 0)) for b in branch_ids}


async def to_read(ctx: RequestContext, branches: list[Branch]) -> list[BranchRead]:
    c = await counts(ctx, [b.id for b in branches]) if branches else {}
    return [
        BranchRead(**b.model_dump(include=set(BranchRead.model_fields) - {"sites_count", "employees_count", "deleted_at"}),
                   sites_count=c.get(b.id, (0, 0))[0], employees_count=c.get(b.id, (0, 0))[1],
                   deleted_at=b.deleted_at.isoformat() if b.deleted_at else None)
        for b in branches
    ]


async def create(ctx: RequestContext, body: BranchCreate) -> Branch:
    _tz(body.timezone)
    branch = Branch(company_id=ctx.company_id, **body.model_dump(exclude={"admin_user_ids"}))
    ctx.session.add(branch)
    try:
        await ctx.session.flush()
    except IntegrityError as exc:
        raise Conflict("A branch with this code already exists", code="CODE_TAKEN") from exc
    # branch admins: grant the branch-admin role scoped to the new branch
    if body.admin_user_ids:
        role = (await ctx.session.exec(select(Role).where(Role.company_id == ctx.company_id, Role.key == "branch_admin"))).first()
        if role:
            for uid in body.admin_user_ids:
                ctx.session.add(UserRole(company_id=ctx.company_id, user_id=uid, role_id=role.id, scope_type="branches", scope_ids=[branch.id]))
    audit(ctx, "branch.created", "branch", branch.id, after=body)
    return branch


async def update(ctx: RequestContext, branch: Branch, body: BranchUpdate) -> Branch:
    data = body.model_dump(exclude_unset=True)
    if "timezone" in data:
        _tz(data["timezone"])
    before = branch.model_dump(include=set(data))
    for k, v in data.items():
        setattr(branch, k, v)
    ctx.session.add(branch)
    try:
        await ctx.session.flush()
    except IntegrityError as exc:
        raise Conflict("A branch with this code already exists", code="CODE_TAKEN") from exc
    audit(ctx, "branch.updated", "branch", branch.id, before=before, after=data)
    return branch


async def _assert_empty(ctx: RequestContext, branch: Branch) -> None:
    s, e = (await counts(ctx, [branch.id]))[branch.id]
    if s or e:
        raise Conflict(f"Reassign {s} site(s) and {e} employee(s) first", code="BRANCH_NOT_EMPTY", sites=s, employees=e)


async def archive(ctx: RequestContext, branch: Branch) -> Branch:
    await _assert_empty(ctx, branch)
    branch.status = "archived"
    ctx.session.add(branch)
    audit(ctx, "branch.archived", "branch", branch.id)
    return branch


async def delete(ctx: RequestContext, branch: Branch, reason: str) -> None:
    if branch.status != "archived":
        raise Conflict("Archive the branch first", code="NOT_ARCHIVED")
    await _assert_empty(ctx, branch)
    soft_delete(ctx, branch, reason, entity="branch")


async def restore_branch(ctx: RequestContext, branch: Branch) -> Branch:
    """Bring back a deleted branch, or reactivate an archived one."""
    if branch.deleted_at is None and branch.status == "archived":
        branch.status = "active"
        ctx.session.add(branch)
        audit(ctx, "branch.unarchived", "branch", branch.id)
        return branch
    clash = (await ctx.session.exec(select(Branch).where(Branch.company_id == ctx.company_id, Branch.code == branch.code, Branch.id != branch.id))).first()
    if clash:
        raise Conflict("Branch code has been reused; change it before restoring", code="CODE_TAKEN")
    restore(ctx, branch, entity="branch")
    return branch
