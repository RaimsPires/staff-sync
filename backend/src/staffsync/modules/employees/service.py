import secrets
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy import update as sa_update
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from staffsync.common.repository import TenantRepository
from staffsync.common.softdelete import restore, soft_delete
from staffsync.core.adapters import notify
from staffsync.core.audit import audit
from staffsync.core.context import RequestContext
from staffsync.core.errors import BusinessRule, Conflict, NotFound, ValidationFailed
from staffsync.core.outbox import emit
from staffsync.core.security import hash_device_id, hash_password
from staffsync.modules.auth.models import CompanyMember, User
from staffsync.modules.auth.service import find_user, normalize_identifier
from staffsync.modules.auth.tokens import revoke_user_sessions
from staffsync.modules.branches.models import Branch
from staffsync.modules.companies.models import Company
from staffsync.modules.employees.models import Device, Employee, EmployeeSite
from staffsync.modules.employees.schemas import DeviceRegisterIn, EmployeeCreate, EmployeeRead, EmployeeUpdate
from staffsync.modules.schedules.models import Shift
from staffsync.modules.sites.models import Site


class EmployeeRepository(TenantRepository[Employee]):
    model = Employee

    def scope(self, stmt):
        sc = self.ctx.scope
        if sc.site_ids is None:
            return stmt
        conds = []
        if sc.branch_ids:
            conds.append(Employee.branch_id.in_(set(sc.branch_ids)))
        if sc.site_ids:
            conds.append(Employee.id.in_(select(EmployeeSite.employee_id).where(EmployeeSite.site_id.in_(set(sc.site_ids)))))
        if self.ctx.employee_id:
            conds.append(Employee.id == self.ctx.employee_id)
        return stmt.where(or_(*conds)) if conds else stmt.where(Employee.id.is_(None))


def new_pin() -> str:
    return f"{secrets.randbelow(10_000):04d}"


def new_badge_token() -> str:
    return "bdg_" + secrets.token_urlsafe(24)


async def seats_used(ctx: RequestContext) -> int:
    return (await ctx.session.exec(select(func.count()).select_from(Employee).where(Employee.company_id == ctx.company_id, Employee.status != "deactivated"))).one()


async def ensure_seat(ctx: RequestContext) -> None:
    company = await ctx.session.get(Company, ctx.company_id)
    if company and company.status == "read_only":
        raise BusinessRule("The workspace is read-only until payment succeeds", code="READ_ONLY")
    if company and await seats_used(ctx) >= company.seat_limit:
        raise BusinessRule("Employee limit of your plan reached", code="PLAN_LIMIT", seat_limit=company.seat_limit)


async def _check_sites(ctx: RequestContext, site_ids: list[UUID]) -> None:
    if not site_ids:
        return
    n = (await ctx.session.exec(select(func.count()).select_from(Site).where(Site.id.in_(site_ids), Site.company_id == ctx.company_id))).one()  # type: ignore[attr-defined]
    if n != len(set(site_ids)):
        raise ValidationFailed("Unknown site in list")
    for s in site_ids:
        ctx.ensure_site(s)


async def _set_sites(ctx: RequestContext, emp: Employee, site_ids: list[UUID], default: UUID | None) -> None:
    await _check_sites(ctx, site_ids)
    if default and default not in site_ids:
        raise ValidationFailed("Default site must be one of the assigned sites")
    current = {l.site_id: l for l in (await ctx.session.exec(select(EmployeeSite).where(EmployeeSite.employee_id == emp.id))).all()}
    for sid, link in current.items():
        if sid not in site_ids:
            await ctx.session.delete(link)
    for sid in site_ids:
        link = current.get(sid)
        if link is None:
            ctx.session.add(EmployeeSite(company_id=ctx.company_id, employee_id=emp.id, site_id=sid, is_default=(sid == default or (default is None and sid == site_ids[0]))))
        else:
            link.is_default = (sid == default) if default else link.is_default


def _phone(raw: str | None) -> str | None:
    if not raw:
        return None
    return normalize_identifier(raw)[1]


async def to_read(ctx: RequestContext, emps: list[Employee]) -> list[EmployeeRead]:
    ids = [e.id for e in emps]
    users = {u.id: u for u in (await ctx.session.exec(select(User).where(User.id.in_([e.user_id for e in emps])))).all()} if emps else {}  # type: ignore[attr-defined]
    links: dict[UUID, list[EmployeeSite]] = {i: [] for i in ids}
    devices: set[UUID] = set()
    if ids:
        for l in (await ctx.session.exec(select(EmployeeSite).where(EmployeeSite.employee_id.in_(ids)))).all():  # type: ignore[attr-defined]
            links[l.employee_id].append(l)
        devices = set((await ctx.session.exec(select(Device.employee_id).where(Device.employee_id.in_(ids), Device.revoked_at.is_(None)))).all())  # type: ignore[attr-defined,union-attr]
    out = []
    for e in emps:
        u = users[e.user_id]
        app = "no_smartphone" if not e.has_smartphone else "installed" if e.id in devices else "invited"
        d = next((l.site_id for l in links[e.id] if l.is_default), None)
        out.append(EmployeeRead(**e.model_dump(include=set(EmployeeRead.model_fields) - {"full_name", "email", "phone", "app_status", "site_ids", "default_site_id", "deleted_at"}),
                                full_name=u.full_name, email=u.email, phone=u.phone, app_status=app, site_ids=[l.site_id for l in links[e.id]], default_site_id=d,
                                deleted_at=e.deleted_at.isoformat() if e.deleted_at else None))
    return out


async def create(ctx: RequestContext, body: EmployeeCreate) -> tuple[Employee, str | None]:
    await ensure_seat(ctx)
    branch = await ctx.session.get(Branch, body.branch_id)
    if branch is None or branch.company_id != ctx.company_id or not ctx.branch_allowed(branch.id):
        raise NotFound("Branch not found")
    if not body.email and not _phone(body.phone):
        raise ValidationFailed("An email or phone number is required so the employee can sign in", code="CONTACT_REQUIRED")
    phone = _phone(body.phone)
    email = body.email.lower() if body.email else None
    user = (await find_user(ctx.session, "phone", phone) if phone else None) or (await find_user(ctx.session, "email", email) if email else None)
    if user is None:
        user = User(full_name=body.full_name, email=email, phone=phone)
        ctx.session.add(user)
        try:
            await ctx.session.flush()
        except IntegrityError as exc:
            raise Conflict("Email or phone already used", code="CONTACT_TAKEN") from exc
    elif (await ctx.session.exec(select(Employee).where(Employee.user_id == user.id, Employee.company_id == ctx.company_id))).first():
        raise Conflict("This person is already an employee", code="ALREADY_EMPLOYEE")
    if (await ctx.session.exec(select(CompanyMember).where(CompanyMember.company_id == ctx.company_id, CompanyMember.user_id == user.id))).first() is None:
        ctx.session.add(CompanyMember(company_id=ctx.company_id, user_id=user.id, status="active"))
    emp = Employee(company_id=ctx.company_id, user_id=user.id, **body.model_dump(include={"employee_no", "branch_id", "job_title", "contract_type", "start_date", "has_smartphone", "require_selfie"}))
    pin = None
    if not body.has_smartphone:
        pin = new_pin()
        emp.pin_hash = hash_password(pin)
        emp.badge_token = new_badge_token()
    ctx.session.add(emp)
    try:
        await ctx.session.flush()
    except IntegrityError as exc:
        raise Conflict("This employee number is already used", code="EMPLOYEE_NO_TAKEN") from exc
    await _set_sites(ctx, emp, body.site_ids, body.default_site_id)
    audit(ctx, "employee.created", "employee", emp.id, after={"employee_no": emp.employee_no, "name": user.full_name}, employee_id=emp.id)
    emit(ctx.session, ctx.company_id, "EmployeeCreated", {"id": str(emp.id)})
    if body.send_invite and body.has_smartphone:
        await send_invite(ctx, emp, user)
    return emp, pin


async def send_invite(ctx: RequestContext, emp: Employee, user: User | None = None) -> None:
    user = user or await ctx.session.get(User, emp.user_id)
    assert user is not None
    company = await ctx.session.get(Company, ctx.company_id)
    text = f"{company.name if company else 'Your company'} invites you to StaffSync. Download the app and sign in with {user.phone or user.email}."
    if user.phone:
        await notify("sms", user.phone, text, subject=None)
    elif user.email:
        await notify("email", user.email, text, subject="Join StaffSync")
    else:
        raise ValidationFailed("No contact to invite")


async def update(ctx: RequestContext, emp: Employee, body: EmployeeUpdate, if_match: int | None) -> Employee:
    if if_match is not None and if_match != emp.version:
        raise Conflict("The employee was changed by someone else", code="VERSION_CONFLICT", version=emp.version)
    data = body.model_dump(exclude_unset=True)
    user = await ctx.session.get(User, emp.user_id)
    assert user is not None
    before = {"employee_no": emp.employee_no, "job_title": emp.job_title, "branch_id": str(emp.branch_id), "name": user.full_name}
    if "full_name" in data:
        user.full_name = data.pop("full_name")
    if "email" in data:
        user.email = data.pop("email")
    if "phone" in data:
        user.phone = _phone(data.pop("phone"))
    site_ids, default = data.pop("site_ids", None), data.pop("default_site_id", None)
    if "branch_id" in data:
        b = await ctx.session.get(Branch, data["branch_id"])
        if b is None or b.company_id != ctx.company_id or not ctx.branch_allowed(b.id):
            raise NotFound("Branch not found")
    for k, v in data.items():
        setattr(emp, k, v)
    emp.version += 1
    ctx.session.add_all([emp, user])
    try:
        await ctx.session.flush()
    except IntegrityError as exc:
        raise Conflict("Employee number, email or phone already used", code="CONFLICT") from exc
    if site_ids is not None:
        await _set_sites(ctx, emp, site_ids, default)
    audit(ctx, "employee.updated", "employee", emp.id, before=before, after={k: str(v) for k, v in body.model_dump(exclude_unset=True).items()}, employee_id=emp.id)
    return emp


async def deactivate(ctx: RequestContext, emp: Employee) -> Employee:
    emp.status = "deactivated"
    ctx.session.add(emp)
    now = datetime.now(UTC)
    for d in (await ctx.session.exec(select(Device).where(Device.employee_id == emp.id, Device.revoked_at.is_(None)))).all():  # type: ignore[union-attr]
        d.revoked_at = now
    await ctx.session.execute(sa_update(Shift).where(Shift.employee_id == emp.id, Shift.starts_at > now, Shift.status != "cancelled").values(status="cancelled"))
    await revoke_user_sessions(ctx.session, emp.user_id, company_id=ctx.company_id)
    audit(ctx, "employee.deactivated", "employee", emp.id, employee_id=emp.id)
    emit(ctx.session, ctx.company_id, "EmployeeDeactivated", {"id": str(emp.id)})
    return emp


async def delete(ctx: RequestContext, emp: Employee, reason: str) -> None:
    if emp.status != "deactivated":
        raise Conflict("Deactivate the employee first", code="NOT_DEACTIVATED")
    soft_delete(ctx, emp, reason, entity="employee")


async def restore_employee(ctx: RequestContext, emp: Employee) -> Employee:
    if (await ctx.session.exec(select(Employee).where(Employee.company_id == ctx.company_id, Employee.employee_no == emp.employee_no, Employee.id != emp.id))).first():
        raise Conflict("Employee number has been reused; change it before restoring", code="EMPLOYEE_NO_TAKEN")
    restore(ctx, emp, entity="employee")
    return emp


async def reactivate(ctx: RequestContext, emp: Employee) -> Employee:
    await ensure_seat(ctx)
    emp.status = "invited"
    ctx.session.add(emp)
    audit(ctx, "employee.reactivated", "employee", emp.id, employee_id=emp.id)
    return emp


async def make_badge(ctx: RequestContext, emp: Employee) -> tuple[str, str]:
    pin = new_pin()
    emp.pin_hash = hash_password(pin)
    emp.badge_token = new_badge_token()
    emp.has_smartphone = False
    ctx.session.add(emp)
    audit(ctx, "employee.badge_issued", "employee", emp.id, employee_id=emp.id)
    return emp.badge_token, pin


# --- devices ------------------------------------------------------------------------------------------


async def active_device(ctx: RequestContext, employee_id: UUID) -> Device | None:
    return (await ctx.session.exec(select(Device).where(Device.employee_id == employee_id, Device.revoked_at.is_(None)))).first()


async def register_device(ctx: RequestContext, body: DeviceRegisterIn) -> Device:
    emp_id = ctx.require_employee()
    h = hash_device_id(body.device_id)
    existing = await active_device(ctx, emp_id)
    if existing is not None:
        if existing.device_id_hash != h:
            raise Conflict("Another phone is already registered. Ask your admin to reset it.", code="DEVICE_BOUND")
        existing.app_version = body.app_version or existing.app_version
        existing.push_token = body.push_token or existing.push_token
        existing.last_active_at = datetime.now(UTC)
        return existing
    from staffsync.modules.attendance.attestation import verify_attestation

    device = Device(company_id=ctx.company_id, employee_id=emp_id, device_id_hash=h, platform=body.platform, model=body.model, app_version=body.app_version,
                    push_token=body.push_token, attestation_status=await verify_attestation(body.platform, body.attestation_token), registered_at=datetime.now(UTC))
    ctx.session.add(device)
    audit(ctx, "device.registered", "device", None, after={"platform": body.platform, "model": body.model}, employee_id=emp_id)
    return device


async def reset_device(ctx: RequestContext, emp: Employee) -> None:
    device = await active_device(ctx, emp.id)
    if device is None:
        raise NotFound("No registered device")
    device.revoked_at = datetime.now(UTC)
    await revoke_user_sessions(ctx.session, emp.user_id, company_id=ctx.company_id)
    audit(ctx, "device.reset", "device", device.id, employee_id=emp.id)
    from staffsync.modules.notifications.service import push_in_app

    push_in_app(ctx.session, ctx.company_id, emp.user_id, "announcement", "Device reset", "Your admin reset your registered phone. Sign in again on your new phone.")
