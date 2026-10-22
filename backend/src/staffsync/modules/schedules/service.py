from datetime import UTC, date, datetime, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import update as sa_update
from sqlmodel import select

from staffsync.common.repository import TenantRepository
from staffsync.common.softdelete import restore, soft_delete
from staffsync.core.audit import audit
from staffsync.core.context import RequestContext
from staffsync.core.errors import BusinessRule, Conflict, NotFound, ValidationFailed
from staffsync.core.outbox import emit
from staffsync.modules.branches.models import Branch
from staffsync.modules.employees.models import Employee, EmployeeSite
from staffsync.modules.leave.models import Holiday, LeaveRequest
from staffsync.modules.notifications.service import push_in_app
from staffsync.modules.schedules.expansion import Rule, expand, overlaps
from staffsync.modules.schedules.models import Schedule, ScheduleAssignment, Shift
from staffsync.modules.schedules.schemas import Conflict as ConflictOut
from staffsync.modules.schedules.schemas import ScheduleCreate, ScheduleRead, ScheduleUpdate
from staffsync.modules.sites.models import Site

HORIZON_WEEKS = 8


class ScheduleRepository(TenantRepository[Schedule]):
    model = Schedule

    def scope(self, stmt):
        ids = self.ctx.scope.site_ids
        if ids is None:
            return stmt
        return stmt.where(Schedule.site_id.in_(set(ids))) if ids else stmt.where(Schedule.id.is_(None))


class ShiftRepository(TenantRepository[Shift]):
    model = Shift

    def scope(self, stmt):
        ids = self.ctx.scope.site_ids
        if ids is None:
            return stmt
        return stmt.where(Shift.site_id.in_(set(ids))) if ids else stmt.where(Shift.id.is_(None))

    def query(self, *, include_deleted: bool = False, only_deleted: bool = False):
        return self.scope(select(Shift).where(Shift.company_id == self.ctx.company_id))


def rule_of(s: Schedule) -> Rule:
    return Rule(s.type, tuple(s.days_of_week), s.start_time, s.end_time, s.crosses_midnight, s.valid_from, s.valid_to, s.rotation)


async def site_tz(ctx: RequestContext, site_id: UUID) -> ZoneInfo:
    site = (await ctx.session.exec(select(Site).where(Site.id == site_id, Site.company_id == ctx.company_id))).first()
    if site is None:
        raise NotFound("Site not found")
    ctx.ensure_site(site.id)
    return ZoneInfo(site.timezone)


async def assignees(ctx: RequestContext, schedule_id: UUID) -> list[UUID]:
    return list((await ctx.session.exec(select(ScheduleAssignment.employee_id).where(ScheduleAssignment.schedule_id == schedule_id))).all())


async def to_read(ctx: RequestContext, rows: list[Schedule]) -> list[ScheduleRead]:
    out = []
    for s in rows:
        out.append(ScheduleRead(**s.model_dump(include=set(ScheduleRead.model_fields) - {"employee_ids", "deleted_at"}), employee_ids=await assignees(ctx, s.id),
                                deleted_at=s.deleted_at.isoformat() if s.deleted_at else None))
    return out


async def _check_employees(ctx: RequestContext, ids: list[UUID]) -> None:
    if not ids:
        return
    emps = (await ctx.session.exec(select(Employee).where(Employee.id.in_(ids), Employee.company_id == ctx.company_id, Employee.status != "deactivated"))).all()  # type: ignore[attr-defined]
    if len(emps) != len(set(ids)):
        raise ValidationFailed("Unknown or deactivated employee")


def _window(tz: ZoneInfo) -> tuple[date, date]:
    today = datetime.now(tz).date()
    return today - timedelta(days=1), today + timedelta(weeks=HORIZON_WEEKS)  # yesterday's night shift may still be running


async def detect_conflicts(ctx: RequestContext, rule: Rule, site_id: UUID, employee_ids: list[UUID], exclude_schedule: UUID | None = None) -> tuple[list[ConflictOut], int]:
    tz = await site_tz(ctx, site_id)
    lo, hi = _window(tz)
    occs = expand(rule, tz, max(lo, rule.valid_from) if rule.type == "recurring" else rule.valid_from, hi if rule.type == "recurring" else rule.valid_from)
    conflicts: list[ConflictOut] = []
    if not occs or not employee_ids:
        return conflicts, len(occs)
    site = await ctx.session.get(Site, site_id)
    branch = await ctx.session.get(Branch, site.branch_id) if site else None
    holidays: set[date] = set()
    if branch and branch.holiday_calendar_id:
        holidays = set((await ctx.session.exec(select(Holiday.date).where(Holiday.calendar_id == branch.holiday_calendar_id))).all())
    assigned = {(e, s) for e, s in (await ctx.session.exec(select(EmployeeSite.employee_id, EmployeeSite.site_id).where(EmployeeSite.employee_id.in_(employee_ids)))).all()}  # type: ignore[attr-defined]
    leaves = (await ctx.session.exec(select(LeaveRequest).where(LeaveRequest.employee_id.in_(employee_ids), LeaveRequest.status == "approved"))).all()  # type: ignore[attr-defined]
    for emp in employee_ids:
        if (emp, site_id) not in assigned:
            conflicts.append(ConflictOut(code="NOT_ASSIGNED_TO_SITE", employee_id=emp, starts_at=occs[0].starts_at, detail="Employee is not assigned to this site"))
        existing = (await ctx.session.exec(select(Shift).where(Shift.employee_id == emp, Shift.status != "cancelled", Shift.ends_at > occs[0].starts_at, Shift.starts_at < occs[-1].ends_at))).all()
        for o in occs:
            for sh in existing:
                if sh.schedule_id != exclude_schedule and overlaps(o.starts_at, o.ends_at, sh.starts_at, sh.ends_at):
                    conflicts.append(ConflictOut(code="OVERLAP", employee_id=emp, starts_at=o.starts_at, detail="Overlaps another shift"))
            if o.local_date in holidays:
                conflicts.append(ConflictOut(code="HOLIDAY", employee_id=emp, starts_at=o.starts_at, detail="Public holiday"))
            if any(l.employee_id == emp and l.start_date <= o.local_date <= l.end_date for l in leaves):
                conflicts.append(ConflictOut(code="ON_LEAVE", employee_id=emp, starts_at=o.starts_at, detail="Approved leave"))
    return conflicts, len(occs)


async def create(ctx: RequestContext, body: ScheduleCreate) -> Schedule:
    await site_tz(ctx, body.site_id)
    await _check_employees(ctx, body.employee_ids)
    s = Schedule(company_id=ctx.company_id, **body.model_dump(exclude={"employee_ids"}))
    ctx.session.add(s)
    await ctx.session.flush()
    for e in dict.fromkeys(body.employee_ids):
        ctx.session.add(ScheduleAssignment(company_id=ctx.company_id, schedule_id=s.id, employee_id=e))
    audit(ctx, "schedule.created", "schedule", s.id, after={"title": s.title, "type": s.type})
    return s


async def update(ctx: RequestContext, s: Schedule, body: ScheduleUpdate) -> Schedule:
    data = body.model_dump(exclude_unset=True, exclude={"employee_ids"})
    if "site_id" in data:
        await site_tz(ctx, data["site_id"])
    for k, v in data.items():
        setattr(s, k, v)
    if s.valid_to and s.valid_to < s.valid_from:
        raise ValidationFailed("valid_to is before valid_from")
    ctx.session.add(s)
    if body.employee_ids is not None:
        await _check_employees(ctx, body.employee_ids)
        cur = {a.employee_id: a for a in (await ctx.session.exec(select(ScheduleAssignment).where(ScheduleAssignment.schedule_id == s.id))).all()}
        for e, a in cur.items():
            if e not in body.employee_ids:
                await ctx.session.delete(a)
        for e in body.employee_ids:
            if e not in cur:
                ctx.session.add(ScheduleAssignment(company_id=ctx.company_id, schedule_id=s.id, employee_id=e))
    await ctx.session.flush()
    audit(ctx, "schedule.updated", "schedule", s.id, after=data and {k: str(v) for k, v in data.items()})
    if s.status == "published":
        await regenerate(ctx, s, notify=True)
    return s


async def regenerate(ctx: RequestContext, s: Schedule, *, notify: bool = False) -> int:
    """Make the shift rows match the rule for the next 8 weeks. Manually moved shifts (exception) are kept."""
    tz = await site_tz(ctx, s.site_id)
    lo, hi = _window(tz)
    occs = expand(rule_of(s), tz, lo, hi) if s.type == "recurring" else expand(rule_of(s), tz, s.valid_from, s.valid_from)
    emps = await assignees(ctx, s.id)
    existing = (await ctx.session.exec(select(Shift).where(Shift.schedule_id == s.id, Shift.starts_at >= datetime.now(UTC) - timedelta(days=1)))).all()
    by_key = {(sh.employee_id, sh.starts_at): sh for sh in existing}
    wanted: set[tuple[UUID, datetime]] = set()
    changed: set[UUID] = set()
    now_utc = datetime.now(UTC)
    for emp in emps:
        for o in occs:
            if o.ends_at < now_utc and (emp, o.starts_at) not in by_key:
                continue  # never create shifts that are already over (they would show up as absences)
            key = (emp, o.starts_at)
            wanted.add(key)
            sh = by_key.get(key)
            if sh is None:
                ctx.session.add(Shift(company_id=ctx.company_id, employee_id=emp, site_id=s.site_id, schedule_id=s.id, starts_at=o.starts_at, ends_at=o.ends_at, grace_min=s.grace_min,
                                      early_leave_tol_min=s.early_leave_tol_min, break_min=s.break_min, is_intervention=s.type == "intervention"))
                changed.add(emp)
            elif not sh.exception:
                if sh.status == "cancelled":
                    sh.status = "scheduled"
                sh.ends_at, sh.grace_min, sh.early_leave_tol_min, sh.break_min, sh.site_id = o.ends_at, s.grace_min, s.early_leave_tol_min, s.break_min, s.site_id
    now = datetime.now(UTC)
    for key, sh in by_key.items():
        if key not in wanted and not sh.exception and sh.starts_at > now and sh.status != "cancelled":
            sh.status = "cancelled"
            changed.add(sh.employee_id)
    if notify and changed:
        users = dict((await ctx.session.exec(select(Employee.id, Employee.user_id).where(Employee.id.in_(changed)))).all())  # type: ignore[attr-defined]
        for emp, uid in users.items():
            push_in_app(ctx.session, ctx.company_id, uid, "schedule_change", "Your schedule changed", s.title, href="/schedule")
    return len(wanted)


async def validate_publish(ctx: RequestContext, s: Schedule) -> list[ConflictOut]:
    c, _ = await detect_conflicts(ctx, rule_of(s), s.site_id, await assignees(ctx, s.id), exclude_schedule=s.id)
    return c


async def publish(ctx: RequestContext, ids: list[UUID], notify: bool, confirm: bool) -> dict:
    rows = [await ScheduleRepository(ctx).get(i) for i in ids]
    all_conflicts = []
    for s in rows:
        all_conflicts += [c.model_dump(mode="json") for c in await validate_publish(ctx, s)]
    if all_conflicts and not confirm:
        raise Conflict("Resolve or confirm the conflicts before publishing", code="SCHEDULE_CONFLICTS", conflicts=all_conflicts)
    n = 0
    for s in rows:
        s.status = "published"
        ctx.session.add(s)
        n += await regenerate(ctx, s, notify=notify)
        audit(ctx, "schedule.published", "schedule", s.id)
        emit(ctx.session, ctx.company_id, "SchedulePublished", {"id": str(s.id)})
    return {"published": len(rows), "shifts": n, "conflicts": all_conflicts}


async def end_or_delete(ctx: RequestContext, s: Schedule, reason: str, end_from: date | None) -> None:
    now = datetime.now(UTC)
    if end_from and s.status == "published":
        s.valid_to = end_from - timedelta(days=1)
        tz = await site_tz(ctx, s.site_id)
        cutoff = datetime.combine(end_from, datetime.min.time(), tz).astimezone(UTC)
        await ctx.session.execute(sa_update(Shift).where(Shift.schedule_id == s.id, Shift.starts_at >= cutoff, Shift.status != "cancelled").values(status="cancelled"))
        ctx.session.add(s)
        audit(ctx, "schedule.ended", "schedule", s.id, reason=reason, after={"end_from": end_from.isoformat()})
        return
    await ctx.session.execute(sa_update(Shift).where(Shift.schedule_id == s.id, Shift.starts_at > now, Shift.status != "cancelled").values(status="cancelled"))
    soft_delete(ctx, s, reason, entity="schedule")


async def restore_schedule(ctx: RequestContext, s: Schedule) -> Schedule:
    restore(ctx, s, entity="schedule")
    await ctx.session.flush()
    if s.status == "published":
        await regenerate(ctx, s)
    return s


async def move_shift(ctx: RequestContext, sh: Shift, starts_at: datetime | None, ends_at: datetime | None, notify: bool) -> Shift:
    if sh.status == "cancelled":
        raise BusinessRule("Shift is cancelled")
    new_start, new_end = starts_at or sh.starts_at, ends_at or sh.ends_at
    if new_end <= new_start:
        raise ValidationFailed("End must be after start")
    if new_start != sh.starts_at:
        sh.previous_starts_at = sh.starts_at
    sh.starts_at, sh.ends_at, sh.exception, sh.updated_by_admin = new_start, new_end, True, True
    ctx.session.add(sh)
    audit(ctx, "shift.moved", "shift", sh.id, employee_id=sh.employee_id)
    if notify:
        emp = await ctx.session.get(Employee, sh.employee_id)
        if emp:
            push_in_app(ctx.session, ctx.company_id, emp.user_id, "schedule_change", "Your shift was updated", "", href=f"/schedule/{sh.id}")
    return sh


async def copy_week(ctx: RequestContext, from_week: date, to_week: date, site_id: UUID | None, employee_ids: list[UUID] | None) -> int:
    start = datetime.combine(from_week - timedelta(days=from_week.weekday()), datetime.min.time(), UTC)
    delta = (to_week - timedelta(days=to_week.weekday())) - (from_week - timedelta(days=from_week.weekday()))
    stmt = ShiftRepository(ctx).query().where(Shift.starts_at >= start, Shift.starts_at < start + timedelta(days=7), Shift.status != "cancelled")
    if site_id:
        stmt = stmt.where(Shift.site_id == site_id)
    if employee_ids:
        stmt = stmt.where(Shift.employee_id.in_(employee_ids))
    n = 0
    for sh in (await ctx.session.exec(stmt)).all():
        ns = sh.starts_at + delta
        dup = (await ctx.session.exec(select(Shift).where(Shift.schedule_id == sh.schedule_id, Shift.employee_id == sh.employee_id, Shift.starts_at == ns))).first()
        if dup:
            continue
        ctx.session.add(Shift(company_id=ctx.company_id, employee_id=sh.employee_id, site_id=sh.site_id, schedule_id=sh.schedule_id, starts_at=ns, ends_at=sh.ends_at + delta,
                              grace_min=sh.grace_min, early_leave_tol_min=sh.early_leave_tol_min, break_min=sh.break_min, is_intervention=sh.is_intervention, exception=True))
        n += 1
    audit(ctx, "schedule.week_copied", "schedule", None, after={"from": from_week.isoformat(), "to": to_week.isoformat(), "shifts": n})
    return n
