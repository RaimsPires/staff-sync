"""Admin-side attendance: listing, manual records, edits with history, bulk actions, live board, employee month views."""

import csv
import io
from datetime import UTC, date, datetime, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import and_, func, or_, text
from sqlmodel import select

from staffsync.common.pagination import build_page, clamp_limit, csv_param, decode_cursor
from staffsync.common.softdelete import restore, soft_delete
from staffsync.core.audit import audit
from staffsync.core.context import RequestContext
from staffsync.core.errors import Conflict, NotFound, ValidationFailed
from staffsync.core.outbox import emit
from staffsync.modules.alerts.models import Alert
from staffsync.modules.attendance import rules
from staffsync.modules.attendance.models import AttendanceNote, AttendanceRecord
from staffsync.modules.attendance.schemas import BulkIn, Counters, FlagOut, LiveSite, ManualRecordIn, RecordPatch, RosterRow
from staffsync.modules.attendance.service import AttendanceRepository, effective_status, to_read
from staffsync.modules.auth.models import User
from staffsync.modules.employees.models import Employee, EmployeeNote
from staffsync.modules.leave.models import LeaveRequest
from staffsync.modules.schedules.models import LIVE_SHIFT, Shift
from staffsync.modules.settings.service import company_settings
from staffsync.modules.sites.models import Site

STATUSES = {"on_time", "late", "early_leave", "overtime", "missing_checkout", "absent", "on_leave", "holiday"}


async def list_records(ctx: RequestContext, *, date_from: date | None, date_to: date | None, site_id: UUID | None, branch_id: UUID | None, employee_id: UUID | None, status: str | None,
                       method: str | None, flagged_only: bool, offline_only: bool, cursor: str | None, limit: int, include_deleted: bool, only_deleted: bool):
    limit = clamp_limit(limit)
    stmt = AttendanceRepository(ctx).query(include_deleted=include_deleted, only_deleted=only_deleted)
    if date_from:
        stmt = stmt.where(AttendanceRecord.occurred_at >= datetime.combine(date_from, datetime.min.time(), UTC) - timedelta(hours=14))
    if date_to:
        stmt = stmt.where(AttendanceRecord.occurred_at < datetime.combine(date_to + timedelta(days=1), datetime.min.time(), UTC) + timedelta(hours=14))
    if site_id:
        stmt = stmt.where(AttendanceRecord.site_id == site_id)
    if branch_id:
        stmt = stmt.where(AttendanceRecord.site_id.in_(select(Site.id).where(Site.branch_id == branch_id)))
    if employee_id:
        stmt = stmt.where(AttendanceRecord.employee_id == employee_id)
    if method:
        stmt = stmt.where(AttendanceRecord.method.in_(csv_param(method)))
    if offline_only:
        stmt = stmt.where(AttendanceRecord.offline_synced.is_(True))
    pending = and_(func.jsonb_array_length(AttendanceRecord.flags) > 0, AttendanceRecord.flag_outcome == "pending")
    if flagged_only:
        stmt = stmt.where(pending)
    sts = csv_param(status)
    if sts:
        conds = [pending if s == "flagged" else AttendanceRecord.status == s for s in sts]
        stmt = stmt.where(or_(*conds))
    cur = decode_cursor(cursor)
    if cur:
        stmt = stmt.where(or_(AttendanceRecord.occurred_at < cur[0], and_(AttendanceRecord.occurred_at == cur[0], AttendanceRecord.id < cur[1])))
    rows = list((await ctx.session.exec(stmt.order_by(AttendanceRecord.occurred_at.desc(), AttendanceRecord.id.desc()).limit(limit + 1))).all())  # type: ignore[attr-defined]
    rows, nxt = build_page(rows, limit, lambda r: (r.occurred_at, r.id))
    return await to_read(ctx, rows), nxt


async def detail(ctx: RequestContext, rec: AttendanceRecord) -> dict:
    read = (await to_read(ctx, [rec]))[0]
    pts = (await ctx.session.execute(text(
        "SELECT ST_Y(in_point::geometry) ilat, ST_X(in_point::geometry) ilng, ST_Y(out_point::geometry) olat, ST_X(out_point::geometry) olng FROM attendance_records WHERE id=:i"), {"i": rec.id})).one()
    notes = (await ctx.session.exec(select(AttendanceNote, User).join(User, User.id == AttendanceNote.author_user_id).where(AttendanceNote.record_id == rec.id).order_by(AttendanceNote.created_at))).all()  # type: ignore[attr-defined]
    from staffsync.core.adapters import get_storage

    selfies = [await get_storage().presign_get(k, 300) for k in rec.selfie_keys]
    timeline = [{"at": rec.check_in_at, "event": "check_in"}] if rec.check_in_at else []
    if rec.check_out_at:
        timeline.append({"at": rec.check_out_at, "event": "check_out"})
    timeline += [{"at": h["at"], "event": "approved" if h.get("approval") else "edited", "by": h.get("by_name"), "reason": h.get("reason")} for h in rec.edit_history]
    return {"record": read, "in_point": {"lat": pts.ilat, "lng": pts.ilng} if pts.ilat is not None else None, "out_point": {"lat": pts.olat, "lng": pts.olng} if pts.olat is not None else None,
            "selfie_urls": selfies, "device_hash_present": bool(rec.device_hash), "timeline": timeline, "history": rec.edit_history,
            "notes": [{"id": n.id, "author": u.full_name, "body": n.body, "created_at": n.created_at} for n, u in notes]}


async def _overlap(ctx: RequestContext, emp_id: UUID, start: datetime, end: datetime | None, exclude: UUID | None = None) -> bool:
    far = end or start + timedelta(minutes=1)
    stmt = select(AttendanceRecord.id).where(AttendanceRecord.employee_id == emp_id, AttendanceRecord.check_in_at.is_not(None),  # type: ignore[union-attr]
                                             AttendanceRecord.check_in_at < far, func.coalesce(AttendanceRecord.check_out_at, AttendanceRecord.check_in_at + timedelta(hours=12)) > start)
    if exclude:
        stmt = stmt.where(AttendanceRecord.id != exclude)
    return (await ctx.session.exec(stmt)).first() is not None


async def manual_create(ctx: RequestContext, body: ManualRecordIn) -> AttendanceRecord:
    from staffsync.modules.employees.service import EmployeeRepository

    emp = await EmployeeRepository(ctx).get(body.employee_id)
    site = (await ctx.session.exec(select(Site).where(Site.id == body.site_id, Site.company_id == ctx.company_id))).first()
    if site is None:
        raise NotFound("Site not found")
    ctx.ensure_site(site.id)
    if body.check_out_at and body.check_out_at <= body.check_in_at:
        raise ValidationFailed("Check-out must be after check-in")
    if body.status and body.status not in STATUSES:
        raise ValidationFailed("Unknown status")
    if await _overlap(ctx, emp.id, body.check_in_at, body.check_out_at):
        raise Conflict("Overlaps an existing record", code="OVERLAP")
    shift = (await ctx.session.exec(select(Shift).where(Shift.employee_id == emp.id, Shift.site_id == site.id, Shift.status.in_(LIVE_SHIFT),
                                                        Shift.starts_at <= body.check_in_at + timedelta(hours=2), Shift.ends_at >= body.check_in_at))).first()
    cfg = await company_settings(ctx.session, ctx.company_id, "attendance")
    res = rules.check_in_result(shift.starts_at if shift else None, shift.grace_min if shift else cfg["grace_min"], body.check_in_at)
    rec = AttendanceRecord(company_id=ctx.company_id, employee_id=emp.id, site_id=site.id, shift_id=shift.id if shift else None, occurred_at=body.check_in_at, check_in_at=body.check_in_at,
                           check_out_at=body.check_out_at, method="manual", actor_user_id=ctx.user.id, status=body.status or res.status, late_min=res.late_min or None, notes=body.notes,
                           selfie_keys=[body.evidence_key] if body.evidence_key else [])
    if body.check_out_at:
        out = rules.check_out_result(shift.ends_at if shift else None, cfg["early_leave_tol_min"], cfg["overtime_threshold_min"], body.check_in_at, body.check_out_at, shift.break_min if shift else 0)
        rec.early_min, rec.overtime_min, rec.worked_min = out.early_min or None, out.overtime_min or None, out.worked_min
        if out.status and not body.status:
            rec.status = out.status
    ctx.session.add(rec)
    await ctx.session.flush()
    audit(ctx, "attendance.manual_created", "attendance", rec.id, after={"in": body.check_in_at.isoformat(), "out": body.check_out_at.isoformat() if body.check_out_at else None}, reason=body.reason, employee_id=emp.id)
    return rec


async def patch(ctx: RequestContext, rec: AttendanceRecord, body: RecordPatch, if_match: int | None) -> AttendanceRecord:
    if if_match is not None and if_match != rec.version:
        raise Conflict("The record was changed by someone else", code="VERSION_CONFLICT", version=rec.version)
    data = body.model_dump(exclude_unset=True, exclude={"reason"})
    if "status" in data and data["status"] not in STATUSES:
        raise ValidationFailed("Unknown status")
    new_in, new_out = data.get("check_in_at", rec.check_in_at), data.get("check_out_at", rec.check_out_at)
    if new_in and new_out and new_out <= new_in:
        raise ValidationFailed("Check-out must be after check-in")
    if new_in and await _overlap(ctx, rec.employee_id, new_in, new_out, exclude=rec.id):
        raise Conflict("Overlaps an existing record", code="OVERLAP")
    before = {k: (getattr(rec, k).isoformat() if hasattr(getattr(rec, k), "isoformat") else getattr(rec, k)) for k in data}
    for k, v in data.items():
        setattr(rec, k, v)
    if ("check_in_at" in data or "check_out_at" in data) and rec.check_in_at:
        shift = await ctx.session.get(Shift, rec.shift_id) if rec.shift_id else None
        cfg = await company_settings(ctx.session, ctx.company_id, "attendance")
        res = rules.check_in_result(shift.starts_at if shift else None, shift.grace_min if shift else cfg["grace_min"], rec.check_in_at)
        rec.late_min = res.late_min or None
        if "status" not in data:
            rec.status = res.status
        if rec.check_out_at:
            out = rules.check_out_result(shift.ends_at if shift else None, cfg["early_leave_tol_min"], cfg["overtime_threshold_min"], rec.check_in_at, rec.check_out_at, shift.break_min if shift else 0)
            rec.early_min, rec.overtime_min, rec.worked_min = out.early_min or None, out.overtime_min or None, out.worked_min
            if out.status and "status" not in data:
                rec.status = out.status
        rec.occurred_at = rec.check_in_at
    after = {k: (getattr(rec, k).isoformat() if hasattr(getattr(rec, k), "isoformat") else getattr(rec, k)) for k in data}
    rec.edit_history = [*rec.edit_history, {"at": datetime.now(UTC).isoformat(), "by": str(ctx.user.id), "by_name": ctx.user.full_name, "before": before, "after": after, "reason": body.reason}]
    rec.version += 1
    ctx.session.add(rec)
    audit(ctx, "attendance.edited", "attendance", rec.id, before=before, after=after, reason=body.reason, employee_id=rec.employee_id)
    emit(ctx.session, ctx.company_id, "AttendanceEdited", {"record_id": str(rec.id)})
    return rec


async def delete(ctx: RequestContext, rec: AttendanceRecord, reason: str) -> None:
    soft_delete(ctx, rec, reason, entity="attendance")


async def restore_record(ctx: RequestContext, rec: AttendanceRecord) -> AttendanceRecord:
    if rec.check_in_at and await _overlap(ctx, rec.employee_id, rec.check_in_at, rec.check_out_at, exclude=rec.id):
        raise Conflict("Overlaps another record", code="OVERLAP")
    restore(ctx, rec, entity="attendance")
    return rec


async def bulk(ctx: RequestContext, body: BulkIn) -> dict:
    from staffsync.modules.alerts.service_resolve import resolve_alert

    done = 0
    for rid in body.record_ids:
        rec = await AttendanceRepository(ctx).get(rid)
        if body.action == "approve":
            alert = (await ctx.session.exec(select(Alert).where(Alert.record_id == rec.id, Alert.status.in_(["open", "escalated"])))).first()  # type: ignore[attr-defined]
            if alert:
                await resolve_alert(ctx, alert, "approved", body.reason)
                done += 1
            elif not any(h.get("approval") for h in rec.edit_history):  # a plain record: sign it off once
                rec.edit_history = [*rec.edit_history, {"at": datetime.now(UTC).isoformat(), "by": str(ctx.user.id), "by_name": ctx.user.full_name, "approval": True, "reason": body.reason}]
                ctx.session.add(rec)
                audit(ctx, "attendance.approved", "attendance", rec.id, reason=body.reason, employee_id=rec.employee_id)
                done += 1
        else:
            rec.status, rec.version = "absent", rec.version + 1
            rec.edit_history = [*rec.edit_history, {"at": datetime.now(UTC).isoformat(), "by": str(ctx.user.id), "by_name": ctx.user.full_name, "after": {"status": "absent"}, "reason": body.reason}]
            ctx.session.add(rec)
            audit(ctx, "attendance.marked_absent", "attendance", rec.id, reason=body.reason, employee_id=rec.employee_id)
            done += 1
    if body.action == "mark_absent":
        from staffsync.modules.schedules.service import ShiftRepository

        for sid in body.shift_ids:
            sh = await ShiftRepository(ctx).get(sid)
            if (await ctx.session.exec(select(AttendanceRecord.id).where(AttendanceRecord.shift_id == sh.id))).first():
                continue
            rec = AttendanceRecord(company_id=ctx.company_id, employee_id=sh.employee_id, site_id=sh.site_id, shift_id=sh.id, occurred_at=sh.starts_at, status="absent", method="admin", actor_user_id=ctx.user.id, notes=body.reason)
            ctx.session.add(rec)
            audit(ctx, "attendance.marked_absent", "attendance", None, reason=body.reason, employee_id=sh.employee_id)
            done += 1
    return {"processed": done}


# --- live board ---------------------------------------------------------------------------------------------


async def live(ctx: RequestContext, site_id: UUID | None) -> list[LiveSite]:
    from staffsync.modules.sites.service import SiteRepository

    sites = [await SiteRepository(ctx).get(site_id)] if site_id else list((await ctx.session.exec(SiteRepository(ctx).query().where(Site.status == "active").order_by(Site.name))).all())
    return [await site_roster(ctx, s) for s in sites]


async def site_roster(ctx: RequestContext, site: Site, now: datetime | None = None) -> LiveSite:
    now = now or datetime.now(UTC)
    tz = ZoneInfo(site.timezone)
    local_midnight = datetime.combine(now.astimezone(tz).date(), datetime.min.time(), tz)
    lo, hi = local_midnight.astimezone(UTC), (local_midnight + timedelta(days=1)).astimezone(UTC)
    shifts = list((await ctx.session.exec(select(Shift).where(Shift.site_id == site.id, Shift.starts_at >= lo, Shift.starts_at < hi, Shift.status.in_(LIVE_SHIFT)).order_by(Shift.starts_at))).all())
    recs = {r.shift_id: r for r in (await ctx.session.exec(select(AttendanceRecord).where(AttendanceRecord.shift_id.in_([s.id for s in shifts])))).all()} if shifts else {}  # type: ignore[attr-defined]
    emps = {e.id: e for e in (await ctx.session.exec(select(Employee).where(Employee.id.in_({s.employee_id for s in shifts})))).all()} if shifts else {}  # type: ignore[attr-defined]
    users = {u.id: u for u in (await ctx.session.exec(select(User).where(User.id.in_({e.user_id for e in emps.values()})))).all()} if emps else {}  # type: ignore[attr-defined]
    # A note a manager left on the person today stands in when the attendance record has none.
    todays_notes: dict[UUID, str] = {}
    if emps:
        for n in (await ctx.session.exec(select(EmployeeNote).where(EmployeeNote.employee_id.in_(list(emps)), EmployeeNote.created_at >= lo, EmployeeNote.created_at < hi).order_by(EmployeeNote.created_at))).all():  # type: ignore[attr-defined]
            todays_notes[n.employee_id] = n.body
    c, rows = Counters(), []
    for sh in shifts:
        emp = emps.get(sh.employee_id)
        if emp is None:
            continue
        u, rec = users[emp.user_id], recs.get(sh.id)
        approval = next((h for h in reversed(rec.edit_history) if h.get("approval")), None) if rec else None
        c.expected += 1
        if sh.status == "on_leave":
            st, c.on_leave = "on_leave", c.on_leave + 1
        elif rec is None or rec.check_in_at is None:
            if rec is not None and rec.status == "absent" or now > sh.starts_at + timedelta(minutes=sh.grace_min) + timedelta(minutes=30):
                st, c.absent = "absent", c.absent + 1
            else:
                st, c.not_arrived = "not_arrived", c.not_arrived + 1
        else:
            st = effective_status(rec)
            if rec.check_out_at:
                c.left += 1
            else:
                c.present += 1
            if st == "flagged":
                c.flagged += 1
        rows.append(RosterRow(employee_id=emp.id, name=u.full_name, phone=u.phone, has_smartphone=emp.has_smartphone, shift_id=sh.id, scheduled_start=sh.starts_at.astimezone(tz).strftime("%H:%M"),
                              scheduled_end=sh.ends_at.astimezone(tz).strftime("%H:%M"), check_in_at=rec.check_in_at if rec else None, check_out_at=rec.check_out_at if rec else None, status=st,
                              method=rec.method if rec else None, distance_m=rec.distance_m if rec else None, flags=[FlagOut(**f) for f in (rec.flags if rec else [])], record_id=rec.id if rec else None,
                              note=(rec.notes if rec else None) or todays_notes.get(emp.id), role=emp.job_title,
                              approved_by=(approval or {}).get("by_name"), approved_at=datetime.fromisoformat(approval["at"]) if approval else None))
    return LiveSite(site_id=site.id, site_name=site.name, counters=c, rows=rows)


# --- export -----------------------------------------------------------------------------------------------


async def export_rows(ctx: RequestContext, **filters) -> list[dict]:
    out: list[dict] = []
    cursor = None
    while len(out) < 50_000:
        page, cursor = await list_records(ctx, cursor=cursor, limit=200, **filters)
        out += [{"date": r.date.isoformat(), "employee": r.employee_name, "site": r.site["name"], "scheduled_start": r.scheduled_start, "scheduled_end": r.scheduled_end,
                 "check_in": r.check_in_at.isoformat() if r.check_in_at else "", "check_out": r.check_out_at.isoformat() if r.check_out_at else "", "worked_min": r.worked_minutes or "",
                 "status": r.status, "method": r.method, "flags": ";".join(f.reason for f in r.flags)} for r in page]
        if not cursor:
            break
    return out


def to_csv(rows: list[dict]) -> bytes:
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=list(rows[0]) if rows else ["date"])
    w.writeheader()
    w.writerows(_safe(rows))
    return buf.getvalue().encode("utf-8-sig")


def _safe(rows):  # neutralise spreadsheet formula injection from user-entered text
    for r in rows:
        yield {k: ("'" + v if isinstance(v, str) and v[:1] in "=+-@" else v) for k, v in r.items()}


def to_xlsx(rows: list[dict]) -> bytes:
    from openpyxl import Workbook

    wb = Workbook()
    ws = wb.active
    ws.append(list(rows[0]) if rows else ["date"])
    for r in _safe(rows):
        ws.append(list(r.values()))
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


# --- employee/mobile views ----------------------------------------------------------------------------------


async def month_view(ctx: RequestContext, employee_id: UUID, month: str) -> dict:
    try:
        y, m = (int(x) for x in month.split("-"))
        first = date(y, m, 1)
    except ValueError as exc:
        raise ValidationFailed("month must be YYYY-MM") from exc
    nxt = date(y + (m == 12), (m % 12) + 1, 1)
    lo, hi = datetime.combine(first, datetime.min.time(), UTC) - timedelta(hours=14), datetime.combine(nxt, datetime.min.time(), UTC) + timedelta(hours=14)
    recs = list((await ctx.session.exec(select(AttendanceRecord).where(AttendanceRecord.employee_id == employee_id, AttendanceRecord.occurred_at >= lo, AttendanceRecord.occurred_at < hi).order_by(AttendanceRecord.occurred_at.desc()))).all())  # type: ignore[attr-defined]
    read = [r for r in await to_read(ctx, recs) if first <= r.date < nxt]
    leaves = (await ctx.session.exec(select(LeaveRequest).where(LeaveRequest.employee_id == employee_id, LeaveRequest.status == "approved", LeaveRequest.start_date < nxt, LeaveRequest.end_date >= first))).all()
    leave_days = 0.0
    for l in leaves:
        d = max(l.start_date, first)
        while d <= min(l.end_date, nxt - timedelta(days=1)):
            leave_days += 1 if d.weekday() < 5 else 0
            d += timedelta(days=1)
    summary = {"present": sum(1 for r in read if r.check_in_at), "late": sum(1 for r in read if r.base_status == "late"), "absent": sum(1 for r in read if r.base_status == "absent"),
               "hours_worked": round(sum(r.worked_minutes or 0 for r in read) / 60, 1), "leave_days": leave_days, "overtime_hours": round(sum(r.overtime_minutes or 0 for r in read) / 60, 1)}
    return {"records": read, "summary": summary}


async def week_summary(ctx: RequestContext, employee_id: UUID) -> dict:
    now = datetime.now(UTC)
    start = datetime.combine((now - timedelta(days=now.weekday())).date(), datetime.min.time(), UTC)
    recs = (await ctx.session.exec(select(AttendanceRecord).where(AttendanceRecord.employee_id == employee_id, AttendanceRecord.occurred_at >= start, AttendanceRecord.check_in_at.is_not(None)))).all()  # type: ignore[union-attr]
    scheduled = (await ctx.session.exec(select(func.count()).select_from(Shift).where(Shift.employee_id == employee_id, Shift.starts_at >= start, Shift.starts_at < start + timedelta(days=7), Shift.status.in_(LIVE_SHIFT)))).one()
    return {"present": len(recs), "late": sum(1 for r in recs if r.status == "late"), "hours_worked": round(sum(r.worked_min or 0 for r in recs) / 60, 1), "scheduled_days": scheduled}
