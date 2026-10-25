"""Mobile-facing views of shifts: assignments with local times, holidays."""

from datetime import UTC, date, datetime, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlmodel import select

from staffsync.core.context import RequestContext
from staffsync.core.errors import NotFound
from staffsync.modules.auth.models import User
from staffsync.modules.branches.models import Branch
from staffsync.modules.employees.models import Employee
from staffsync.modules.leave.models import Holiday
from staffsync.modules.schedules.models import LIVE_SHIFT, Schedule, Shift
from staffsync.modules.schedules.schemas import AssignmentRead
from staffsync.modules.sites import geo_queries
from staffsync.modules.sites.models import Site, SiteManager


async def to_assignments(ctx: RequestContext, rows: list[Shift]) -> list[AssignmentRead]:
    if not rows:
        return []
    sites = {s.id: s for s in (await ctx.session.exec(select(Site).where(Site.id.in_({r.site_id for r in rows})).execution_options(include_deleted=True))).all()}  # type: ignore[attr-defined]
    scheds = {s.id: s for s in (await ctx.session.exec(select(Schedule).where(Schedule.id.in_({r.schedule_id for r in rows})).execution_options(include_deleted=True))).all()}  # type: ignore[attr-defined]
    geos = await geo_queries.geo_for_sites(ctx.session, list(sites))
    mgr: dict[UUID, User | None] = {}
    for sid in sites:
        mgr[sid] = (await ctx.session.exec(select(User).join(SiteManager, SiteManager.user_id == User.id).where(SiteManager.site_id == sid))).first()
    out = []
    for sh in rows:
        site, sched = sites[sh.site_id], scheds[sh.schedule_id]
        tz = ZoneInfo(site.timezone)
        ls, le = sh.starts_at.astimezone(tz), sh.ends_at.astimezone(tz)
        m = mgr[site.id]
        requires = [r for r, on in (("selfie", site.require_selfie), ("qr", site.require_qr)) if on]
        out.append(AssignmentRead(
            id=sh.id, type="intervention" if sh.is_intervention else "shift",
            site={"id": site.id, "name": site.name, "address": site.address, "center": geos[site.id]["center"], "geofence": geos[site.id]["geojson"], "min_accuracy_m": site.min_accuracy_m,
                  "requires": requires, "manager_name": m.full_name if m else None, "manager_phone": m.phone if m else None},
            date=ls.date(), start=ls.strftime("%H:%M"), end=le.strftime("%H:%M"), starts_at=sh.starts_at, ends_at=sh.ends_at, grace_min=sh.grace_min, early_leave_tol_min=sh.early_leave_tol_min,
            instructions=sched.instructions, updated_by_admin=sh.updated_by_admin,
            previous_start=sh.previous_starts_at.astimezone(tz).strftime("%H:%M") if sh.previous_starts_at else None, attachments=sched.attachments, status=sh.status))
    return out


async def my_range(ctx: RequestContext, start: date, end: date) -> list[AssignmentRead]:
    emp = ctx.require_employee()
    lo, hi = datetime.combine(start - timedelta(days=1), datetime.min.time(), UTC), datetime.combine(end + timedelta(days=2), datetime.min.time(), UTC)
    rows = (await ctx.session.exec(select(Shift).where(Shift.employee_id == emp, Shift.status.in_(LIVE_SHIFT), Shift.starts_at >= lo, Shift.starts_at < hi).order_by(Shift.starts_at))).all()
    res = await to_assignments(ctx, list(rows))
    return [a for a in res if start <= a.date <= end]


async def my_shift(ctx: RequestContext, shift_id: UUID) -> AssignmentRead:
    sh = (await ctx.session.exec(select(Shift).where(Shift.id == shift_id, Shift.employee_id == ctx.require_employee(), Shift.status.in_(LIVE_SHIFT)))).first()
    if sh is None:
        raise NotFound()
    return (await to_assignments(ctx, [sh]))[0]


async def my_today(ctx: RequestContext) -> list[AssignmentRead]:
    """'Today' is the site's local day: fetch a 3-day window, keep assignments dated today in their own site's timezone."""
    now = datetime.now(UTC)
    window = await my_range(ctx, now.date() - timedelta(days=1), now.date() + timedelta(days=1))
    tzs = {s.id: ZoneInfo(s.timezone) for s in (await ctx.session.exec(select(Site).where(Site.id.in_({a.site["id"] for a in window})))).all()} if window else {}  # type: ignore[attr-defined]
    return [a for a in window if a.date == now.astimezone(tzs[a.site["id"]]).date()]


async def my_holidays(ctx: RequestContext, start: date, end: date) -> list[date]:
    emp = await ctx.session.get(Employee, ctx.require_employee())
    branch = await ctx.session.get(Branch, emp.branch_id) if emp else None
    if not branch or not branch.holiday_calendar_id:
        return []
    return list((await ctx.session.exec(select(Holiday.date).where(Holiday.calendar_id == branch.holiday_calendar_id, Holiday.date >= start, Holiday.date <= end))).all())
