"""Site-manager mode of the mobile app: today's roster, counters, badge lookup, leave recommendations."""

from datetime import UTC, date, datetime, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import APIRouter
from sqlalchemy import func
from sqlmodel import select

from staffsync.common.enums import Perm
from staffsync.core.deps import require
from staffsync.core.errors import NotFound
from staffsync.modules.attendance import admin
from staffsync.modules.auth.models import User
from staffsync.modules.employees.models import Employee, EmployeeSite
from staffsync.modules.employees.service import EmployeeRepository
from staffsync.modules.leave import service as leave_service
from staffsync.modules.leave.models import LeaveRequest
from staffsync.modules.schedules.models import LIVE_SHIFT, Shift
from staffsync.modules.sites.models import Site
from staffsync.modules.sites.service import SiteRepository

router = APIRouter(prefix="/manager", tags=["manager"])


@router.get("/sites")
async def my_sites(ctx=require(Perm.ATTENDANCE_VIEW)):
    sites = (await ctx.session.exec(SiteRepository(ctx).query().where(Site.status == "active").order_by(Site.name))).all()
    out = []
    for s in sites:
        roster = await admin.site_roster(ctx, s)
        out.append({"id": s.id, "name": s.name, "address": s.address, "expected": roster.counters.expected})
    return out


@router.get("/sites/{site_id}/roster")
async def roster(site_id: UUID, ctx=require(Perm.ATTENDANCE_VIEW)):
    return (await admin.site_roster(ctx, await SiteRepository(ctx).get(site_id))).rows


@router.get("/sites/{site_id}/summary")
async def summary(site_id: UUID, ctx=require(Perm.ATTENDANCE_VIEW)):
    site = await SiteRepository(ctx).get(site_id)
    live = await admin.site_roster(ctx, site)
    alerts = []
    for r in live.rows:
        if r.status == "late":
            alerts.append({"id": f"late-{r.employee_id}", "kind": "late", "employee_id": r.employee_id, "name": r.name, "phone": r.phone, "time": r.check_in_at.astimezone(ZoneInfo(site.timezone)).strftime("%H:%M") if r.check_in_at else None})
        if r.flags:
            alerts.append({"id": f"flag-{r.employee_id}", "kind": "flag", "employee_id": r.employee_id, "name": r.name, "phone": r.phone})
        now = datetime.now(UTC)
        if r.check_in_at and not r.check_out_at and r.scheduled_end < now.astimezone(ZoneInfo(site.timezone)).strftime("%H:%M") and r.status != "left":
            alerts.append({"id": f"co-{r.employee_id}", "kind": "missing_checkout", "employee_id": r.employee_id, "name": r.name, "phone": r.phone, "time": r.scheduled_end})
    pending = (await ctx.session.exec(select(func.count()).select_from(LeaveRequest).where(
        LeaveRequest.employee_id.in_(select(EmployeeSite.employee_id).where(EmployeeSite.site_id == site.id)), LeaveRequest.levels == 2, LeaveRequest.status == "pending"))).one()  # type: ignore[attr-defined]
    if pending:
        alerts.append({"id": "leave", "kind": "leave_request", "count": pending})
    c = live.counters
    return {"expected": c.expected, "present": c.present, "not_arrived": c.not_arrived, "left": c.left, "absent": c.absent, "on_leave": c.on_leave, "flagged": c.flagged, "pending_leave": pending, "alerts": alerts}


@router.get("/badges/{token}")
async def by_badge(token: str, site_id: UUID, ctx=require(Perm.ATTENDANCE_PROXY)):
    emp = (await ctx.session.exec(select(Employee).where(Employee.badge_token == token, Employee.company_id == ctx.company_id))).first()
    if emp is None:
        raise NotFound("Badge not recognised")
    await EmployeeRepository(ctx).get(emp.id)  # scope check
    live = await admin.site_roster(ctx, await SiteRepository(ctx).get(site_id))
    row = next((r for r in live.rows if r.employee_id == emp.id), None)
    if row is None:
        u = await ctx.session.get(User, emp.user_id)
        return {"employee_id": emp.id, "name": u.full_name if u else None, "scheduled_here": False, "has_smartphone": emp.has_smartphone}
    return {**row.model_dump(mode="json"), "scheduled_here": True}


@router.get("/employees/{employee_id}/shifts")
async def employee_shifts(employee_id: UUID, start: date, end: date, ctx=require(Perm.ATTENDANCE_VIEW)):
    emp = await EmployeeRepository(ctx).get(employee_id)
    rows = (await ctx.session.exec(select(Shift).where(Shift.employee_id == emp.id, Shift.status.in_(LIVE_SHIFT), Shift.starts_at >= datetime.combine(start, datetime.min.time(), UTC),
                                                       Shift.starts_at < datetime.combine(end + timedelta(days=1), datetime.min.time(), UTC)).order_by(Shift.starts_at))).all()
    return [{"date": s.starts_at.date(), "start": s.starts_at.strftime("%H:%M"), "end": s.ends_at.strftime("%H:%M")} for s in rows]


@router.get("/sites/{site_id}/leave")
async def leave_inbox(site_id: UUID, ctx=require(Perm.LEAVE_RECOMMEND)):
    site = await SiteRepository(ctx).get(site_id)
    stmt = select(LeaveRequest).where(LeaveRequest.employee_id.in_(select(EmployeeSite.employee_id).where(EmployeeSite.site_id == site.id)), LeaveRequest.status.in_(["pending", "recommended"])).order_by(LeaveRequest.created_at.desc())  # type: ignore[attr-defined]
    reqs = list((await ctx.session.exec(stmt)).all())
    reads = await leave_service.to_read(ctx, reqs, with_timeline=True)
    items = []
    for req, read in zip(reqs, reads, strict=True):
        cov = await leave_service.coverage(ctx, req)
        items.append({**read.model_dump(mode="json"), "others": cov["colleagues_off"], "affected_shifts": cov["affected_shifts"]})
    return items
