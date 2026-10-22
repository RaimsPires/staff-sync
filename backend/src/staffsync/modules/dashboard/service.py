from datetime import UTC, datetime, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import func, text
from sqlmodel import select

from staffsync.core.context import RequestContext
from staffsync.modules.attendance import admin
from staffsync.modules.attendance.models import AttendanceRecord
from staffsync.modules.attendance.service import AttendanceRepository, to_read
from staffsync.modules.companies.models import Company
from staffsync.modules.employees.models import Employee
from staffsync.modules.leave.models import LeaveRequest
from staffsync.modules.schedules.models import Schedule, ScheduleAssignment
from staffsync.modules.sites.models import Site
from staffsync.modules.sites.service import SiteRepository


def _scope_sites(ctx: RequestContext):
    ids = ctx.scope.site_ids
    return None if ids is None else list(ids)


async def overview(ctx: RequestContext, days: int, site_id: UUID | None, branch_id: UUID | None) -> dict:
    company = await ctx.session.get(Company, ctx.company_id)
    tz = ZoneInfo(company.timezone if company else "UTC")
    stmt = SiteRepository(ctx).query().where(Site.status == "active")
    if site_id:
        stmt = stmt.where(Site.id == site_id)
    if branch_id:
        stmt = stmt.where(Site.branch_id == branch_id)
    sites = list((await ctx.session.exec(stmt)).all())
    ids = [s.id for s in sites]
    emp_count = (await ctx.session.exec(select(func.count()).select_from(Employee).where(Employee.company_id == ctx.company_id, Employee.status != "deactivated"))).one()
    if not sites and emp_count == 0:
        return {"empty": True, "setup": True}
    today = datetime.now(tz).date()
    live = [await admin.site_roster(ctx, s) for s in sites]
    k = {"expected": 0, "present": 0, "left": 0, "late": 0, "absent": 0, "on_leave": 0, "flagged": 0, "not_arrived": 0}
    for ls in live:
        for f in ("expected", "present", "left", "absent", "on_leave", "flagged", "not_arrived"):
            k[f] += getattr(ls.counters, f)
        k["late"] += sum(1 for r in ls.rows if r.status == "late")
    pending_leave = (await ctx.session.exec(select(func.count()).select_from(LeaveRequest).where(LeaveRequest.company_id == ctx.company_id, LeaveRequest.status.in_(["pending", "recommended"])))).one()  # type: ignore[attr-defined]

    lo = datetime.combine(today - timedelta(days=days - 1), datetime.min.time(), tz).astimezone(UTC)
    hi = datetime.combine(today + timedelta(days=1), datetime.min.time(), tz).astimezone(UTC)
    tzname = tz.key
    params = {"cid": ctx.company_id, "lo": lo, "hi": hi, "tz": tzname, "sites": ids or [UUID(int=0)]}
    exp_rows = (await ctx.session.execute(text("SELECT (starts_at AT TIME ZONE :tz)::date d, count(*) n FROM shifts WHERE company_id=:cid AND site_id = ANY(:sites) AND status='scheduled' AND starts_at>=:lo AND starts_at<:hi GROUP BY 1"), params)).all()
    pres_rows = (await ctx.session.execute(text("SELECT (occurred_at AT TIME ZONE :tz)::date d, count(*) n FROM attendance_records WHERE company_id=:cid AND site_id = ANY(:sites) AND deleted_at IS NULL AND check_in_at IS NOT NULL AND occurred_at>=:lo AND occurred_at<:hi GROUP BY 1"), params)).all()
    exp, pres = {r.d: r.n for r in exp_rows}, {r.d: r.n for r in pres_rows}
    trend = [{"date": (today - timedelta(days=i)).isoformat(), "expected": exp.get(today - timedelta(days=i), 0), "present": pres.get(today - timedelta(days=i), 0),
              "rate": round(min(pres.get(today - timedelta(days=i), 0) / exp[today - timedelta(days=i)], 1), 3) if exp.get(today - timedelta(days=i)) else None} for i in range(days - 1, -1, -1)]
    punct = (await ctx.session.execute(text("SELECT s.id, s.name, count(*) FILTER (WHERE r.status='on_time') ot, count(*) FILTER (WHERE r.status='late') lt FROM attendance_records r JOIN sites s ON s.id=r.site_id "
                                            "WHERE r.company_id=:cid AND r.site_id = ANY(:sites) AND r.deleted_at IS NULL AND r.occurred_at>=:lo AND r.occurred_at<:hi GROUP BY s.id, s.name"), params)).all()
    methods = (await ctx.session.execute(text("SELECT method, count(*) n FROM attendance_records WHERE company_id=:cid AND site_id = ANY(:sites) AND deleted_at IS NULL AND occurred_at>=:lo AND occurred_at<:hi AND check_in_at IS NOT NULL GROUP BY method"), params)).all()
    alert_counts = dict((await ctx.session.execute(text("SELECT type, count(*) FROM alerts WHERE company_id=:cid AND status IN ('open','escalated') AND (site_id = ANY(:sites) OR site_id IS NULL) GROUP BY type"), params)).all())
    unassigned = (await ctx.session.exec(select(func.count()).select_from(Schedule).where(Schedule.company_id == ctx.company_id, Schedule.type == "intervention", Schedule.status == "published", Schedule.valid_from >= today,
                  ~Schedule.id.in_(select(ScheduleAssignment.schedule_id))))).one()  # type: ignore[attr-defined]
    yesterday = today - timedelta(days=1)
    return {
        "empty": False,
        "date": today.isoformat(),
        "kpis": {**k, "pending_leave": pending_leave, "yesterday": {"expected": exp.get(yesterday, 0), "present": pres.get(yesterday, 0)}},
        "trend": trend,
        "punctuality": [{"site_id": r.id, "site": r.name, "on_time": r.ot, "late": r.lt, "rate": round(r.ot / (r.ot + r.lt), 3) if (r.ot + r.lt) else None} for r in punct],
        "methods": {r.method: r.n for r in methods},
        "needs_attention": {"flagged": alert_counts.get("flagged", 0), "missing_checkout": alert_counts.get("missing_checkout", 0), "unscheduled": alert_counts.get("unscheduled", 0),
                            "uncovered_interventions": alert_counts.get("uncovered_intervention", 0), "pending_leave": pending_leave, "unassigned_interventions": unassigned},
        "sites": [{"id": ls.site_id, "name": ls.site_name, "present": ls.counters.present, "expected": ls.counters.expected} for ls in live],
    }


async def activity(ctx: RequestContext, limit: int = 20) -> list:
    rows = list((await ctx.session.exec(AttendanceRepository(ctx).query().where(AttendanceRecord.check_in_at.is_not(None)).order_by(AttendanceRecord.occurred_at.desc()).limit(limit))).all())  # type: ignore[union-attr,attr-defined]
    return [{"record_id": r.id, "employee": r.employee_name, "site": r.site["name"], "at": r.check_out_at or r.check_in_at, "event": "check_out" if r.check_out_at else "check_in", "method": r.method, "status": r.status} for r in await to_read(ctx, rows)]
