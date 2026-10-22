"""Check-in / check-out use cases. The phone's claims are never trusted: everything is re-verified here, and a failed
rule adds a flag to the saved record instead of rejecting the check-in."""

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import text
from sqlmodel import select

from staffsync.common.repository import TenantRepository
from staffsync.core.audit import audit
from staffsync.core.context import RequestContext
from staffsync.core.errors import AppError, BusinessRule, Conflict, Forbidden, NotFound, RateLimited, ValidationFailed
from staffsync.core.outbox import emit
from staffsync.core.redis import get_redis
from staffsync.core.security import verify_password
from staffsync.modules.alerts.service import raise_for_record
from staffsync.modules.attendance import rules
from staffsync.modules.attendance.models import AttendanceRecord
from staffsync.modules.attendance.schemas import CheckEventIn, CheckResult, FlagOut, ProxyIn, RecordRead
from staffsync.modules.attendance.verifiers import Evidence, Flag, run_pipeline
from staffsync.modules.auth.models import User
from staffsync.modules.employees.models import Device, Employee
from staffsync.modules.schedules.models import Shift
from staffsync.modules.settings.service import company_settings
from staffsync.modules.sites import geo_queries
from staffsync.modules.sites.models import Site
from staffsync.modules.sites.service import verify_qr

PIN_MAX = 5
PIN_LOCK_S = 900


class UnscheduledError(AppError):
    status, code, title = 422, "UNSCHEDULED", "Not scheduled at this site"


class AttendanceRepository(TenantRepository[AttendanceRecord]):
    model = AttendanceRecord

    def scope(self, stmt):
        ids = self.ctx.scope.site_ids
        if ids is None:
            return stmt
        return stmt.where(AttendanceRecord.site_id.in_(set(ids))) if ids else stmt.where(AttendanceRecord.id.is_(None))


async def own_record(ctx: RequestContext, record_id: UUID) -> AttendanceRecord:
    """An employee's own record: ownership, not site scope, is the access rule on /me endpoints."""
    rec = (await ctx.session.exec(select(AttendanceRecord).where(AttendanceRecord.id == record_id, AttendanceRecord.employee_id == ctx.require_employee(),
                                                                  AttendanceRecord.company_id == ctx.company_id))).first()
    if rec is None:
        raise NotFound()
    return rec


def effective_status(r: AttendanceRecord) -> str:
    return "flagged" if r.flags and r.flag_outcome == "pending" else r.status


def wkt(lng: float, lat: float) -> str:
    return f"SRID=4326;POINT({lng} {lat})"


def _hm(dt: datetime | None, tz: ZoneInfo) -> str | None:
    return dt.astimezone(tz).strftime("%H:%M") if dt else None


async def to_read(ctx: RequestContext, recs: list[AttendanceRecord]) -> list[RecordRead]:
    if not recs:
        return []
    sites = {s.id: s for s in (await ctx.session.exec(select(Site).where(Site.id.in_({r.site_id for r in recs})).execution_options(include_deleted=True))).all()}  # type: ignore[attr-defined]
    shift_ids = {r.shift_id for r in recs if r.shift_id}
    shifts = {s.id: s for s in (await ctx.session.exec(select(Shift).where(Shift.id.in_(shift_ids)))).all()} if shift_ids else {}  # type: ignore[attr-defined]
    emps = {e.id: e for e in (await ctx.session.exec(select(Employee).where(Employee.id.in_({r.employee_id for r in recs})).execution_options(include_deleted=True))).all()}  # type: ignore[attr-defined]
    users = {u.id: u for u in (await ctx.session.exec(select(User).where(User.id.in_({e.user_id for e in emps.values()} | {r.actor_user_id for r in recs if r.actor_user_id})))).all()}  # type: ignore[attr-defined]
    out = []
    for r in recs:
        site, shift = sites[r.site_id], shifts.get(r.shift_id) if r.shift_id else None
        tz = ZoneInfo(site.timezone)
        emp = emps.get(r.employee_id)
        out.append(RecordRead(
            id=r.id, date=r.occurred_at.astimezone(tz).date(), employee_id=r.employee_id, employee_name=users[emp.user_id].full_name if emp else None,
            site={"id": site.id, "name": site.name}, shift_id=r.shift_id, scheduled_start=_hm(shift.starts_at, tz) if shift else None, scheduled_end=_hm(shift.ends_at, tz) if shift else None,
            check_in_at=r.check_in_at, check_out_at=r.check_out_at, status=effective_status(r), base_status=r.status, late_by_minutes=r.late_min, early_by_minutes=r.early_min,
            overtime_minutes=r.overtime_min, worked_minutes=r.worked_min, method=r.method, proxy_by=users[r.actor_user_id].full_name if r.method == "proxy" and r.actor_user_id in users else None,
            flags=[FlagOut(**f) for f in r.flags], flag_outcome=r.flag_outcome, employee_comment=r.employee_comment, admin_note=r.notes, offline_synced=r.offline_synced,
            distance_m=r.distance_m, in_accuracy_m=r.in_accuracy_m, version=r.version, deleted_at=r.deleted_at.isoformat() if r.deleted_at else None))
    return out


# --- shared pieces ------------------------------------------------------------------------------------


async def _last_point(ctx: RequestContext, employee_id: UUID, before: datetime) -> tuple[float, float, datetime] | None:
    row = (await ctx.session.execute(text(
        "SELECT lat, lng, ts FROM ("
        " SELECT ST_Y(in_point::geometry) lat, ST_X(in_point::geometry) lng, check_in_at ts FROM attendance_records WHERE employee_id=:e AND in_point IS NOT NULL AND deleted_at IS NULL"
        " UNION ALL"
        " SELECT ST_Y(out_point::geometry), ST_X(out_point::geometry), check_out_at FROM attendance_records WHERE employee_id=:e AND out_point IS NOT NULL AND deleted_at IS NULL"
        ") x WHERE ts < :b ORDER BY ts DESC LIMIT 1"), {"e": employee_id, "b": before})).first()
    return (row.lat, row.lng, row.ts) if row else None


async def find_shift(ctx: RequestContext, employee_id: UUID, shift_id: UUID | None, site_id: UUID | None, at: datetime, window_before_min: int) -> Shift | None:
    if shift_id:
        sh = (await ctx.session.exec(select(Shift).where(Shift.id == shift_id, Shift.employee_id == employee_id, Shift.status != "cancelled"))).first()
        if sh is None:
            raise NotFound("Shift not found")
        return sh
    stmt = select(Shift).where(Shift.employee_id == employee_id, Shift.status == "scheduled", Shift.starts_at <= at + timedelta(minutes=window_before_min), Shift.ends_at >= at)
    if site_id:
        stmt = stmt.where(Shift.site_id == site_id)
    rows = (await ctx.session.exec(stmt)).all()
    return min(rows, key=lambda s: abs((s.starts_at - at).total_seconds())) if rows else None


@dataclass
class Prepared:
    site: Site
    shift: Shift | None
    flags: list[Flag]
    inside: bool
    distance_m: float
    when: datetime


async def _verify(ctx: RequestContext, emp: Employee, site: Site, shift: Shift | None, ev: CheckEventIn, *, offline: bool, skip: set[str], selfie_prefix_user: UUID | None, device_hash: str | None) -> Prepared:
    cfg = await company_settings(ctx.session, ctx.company_id, "attendance")
    now = datetime.now(UTC)
    inside, dist = await geo_queries.probe(ctx.session, site.id, ev.lat, ev.lng)
    device = (await ctx.session.exec(select(Device).where(Device.employee_id == emp.id, Device.revoked_at.is_(None)))).first()
    if device:
        device.last_active_at = now
    prefix = f"selfies/{ctx.company_id}/{selfie_prefix_user}/" if selfie_prefix_user else None
    evidence = Evidence(
        now=now, captured_at=ev.captured_at, lat=ev.lat, lng=ev.lng, accuracy_m=ev.accuracy_m, is_mock=ev.is_mock_location or (cfg["block_mock_location"] and ev.is_mock_location),
        inside=inside, distance_m=dist, site_min_accuracy_m=site.min_accuracy_m, site_device_binding=site.device_binding,
        require_selfie=site.require_selfie or emp.require_selfie, require_qr=site.require_qr,
        selfie_ok=bool(ev.selfie_key) and (prefix is None or (ev.selfie_key or "").startswith(prefix)), qr_ok=verify_qr(site, ev.qr_payload),
        shift_found=shift is not None, device_hash=device_hash, active_device_hash=device.device_id_hash if device else None,
        attestation_status=device.attestation_status if device else "unverified", offline=offline, last_point=await _last_point(ctx, emp.id, ev.captured_at),
        time_tolerance_s=cfg["time_tolerance_s"], max_sync_delay_h=cfg["max_sync_delay_h"], max_speed_kmh=cfg["max_speed_kmh"], block_mock=cfg["block_mock_location"], skip=skip,
    )
    when = ev.captured_at if offline and ev.captured_at <= now + timedelta(seconds=cfg["time_tolerance_s"]) else now
    return Prepared(site, shift, run_pipeline(evidence), inside, dist, when)


async def _site(ctx: RequestContext, site_id: UUID) -> Site:
    site = (await ctx.session.exec(select(Site).where(Site.id == site_id, Site.company_id == ctx.company_id))).first()
    if site is None:
        raise NotFound("Site not found")
    if site.status != "active":
        raise BusinessRule("This site does not accept check-ins", code="SITE_INACTIVE")
    return site


async def _by_event(ctx: RequestContext, employee_id: UUID, event_id: str) -> AttendanceRecord | None:
    return (await ctx.session.exec(select(AttendanceRecord).where(AttendanceRecord.employee_id == employee_id,
            (AttendanceRecord.client_event_id == event_id) | (AttendanceRecord.out_client_event_id == event_id)).execution_options(include_deleted=True))).first()


def _merge_flags(rec: AttendanceRecord, flags: list[Flag]) -> list[dict]:
    have = {f["reason"] for f in rec.flags}
    return rec.flags + [f.as_dict() for f in flags if f.reason not in have]


async def _result(ctx: RequestContext, rec: AttendanceRecord) -> CheckResult:
    read = (await to_read(ctx, [rec]))[0]
    return CheckResult(record=read, flags=read.flags)


# --- check-in -----------------------------------------------------------------------------------------


async def check_in(ctx: RequestContext, ev: CheckEventIn, *, offline: bool = False) -> CheckResult:
    emp = await ctx.session.get(Employee, ctx.require_employee())
    assert emp is not None
    if emp.status == "deactivated":
        raise Forbidden("Account disabled", code="ACCOUNT_DISABLED")
    if (dup := await _by_event(ctx, emp.id, ev.client_event_id)) is not None:  # idempotent retry: same answer as the first time
        return await _result(ctx, dup)
    cfg = await company_settings(ctx.session, ctx.company_id, "attendance")
    shift = await find_shift(ctx, emp.id, ev.shift_id, ev.site_id, ev.captured_at if offline else datetime.now(UTC), cfg["shift_window_before_min"])
    site_id = shift.site_id if shift else ev.site_id
    if site_id is None:
        raise ValidationFailed("site_id or shift_id is required")
    site = await _site(ctx, site_id)
    if shift is None and not ev.accept_unscheduled and not offline:
        raise UnscheduledError("You are not scheduled at this site. Check in anyway to have it reviewed.")
    open_rec = (await ctx.session.exec(select(AttendanceRecord).where(AttendanceRecord.employee_id == emp.id, AttendanceRecord.check_in_at.is_not(None), AttendanceRecord.check_out_at.is_(None),  # type: ignore[union-attr]
                AttendanceRecord.occurred_at > datetime.now(UTC) - timedelta(hours=20)))).first()
    if open_rec and not offline:
        raise Conflict("You are already checked in", code="ALREADY_CHECKED_IN", record_id=str(open_rec.id))
    if shift and (await ctx.session.exec(select(AttendanceRecord.id).where(AttendanceRecord.shift_id == shift.id, AttendanceRecord.check_in_at.is_not(None)))).first():  # type: ignore[union-attr]
        raise Conflict("This shift already has a check-in", code="ALREADY_CHECKED_IN")
    p = await _verify(ctx, emp, site, shift, ev, offline=offline, skip=set(), selfie_prefix_user=ctx.user.id, device_hash=ctx.device_hash)
    res = rules.check_in_result(shift.starts_at if shift else None, shift.grace_min if shift else cfg["grace_min"], p.when)
    rec = AttendanceRecord(
        company_id=ctx.company_id, employee_id=emp.id, site_id=site.id, shift_id=shift.id if shift else None, occurred_at=p.when, check_in_at=p.when, in_point=wkt(ev.lng, ev.lat),
        in_accuracy_m=ev.accuracy_m, distance_m=p.distance_m, method=ev.method, actor_user_id=None, status=res.status, late_min=res.late_min or None,
        flags=[f.as_dict() for f in p.flags], flag_outcome="pending" if p.flags else None, selfie_keys=[ev.selfie_key] if ev.selfie_key else [], offline_synced=offline,
        client_event_id=ev.client_event_id, device_hash=ctx.device_hash,
    )
    ctx.session.add(rec)
    await ctx.session.flush()
    await raise_for_record(ctx.session, rec, rec.flags)
    emit(ctx.session, ctx.company_id, "CheckInRecorded", {"record_id": str(rec.id), "site_id": str(site.id), "employee_id": str(emp.id), "status": rec.status, "flagged": bool(rec.flags)})
    return await _result(ctx, rec)


# --- check-out ----------------------------------------------------------------------------------------


async def _open_record(ctx: RequestContext, employee_id: UUID, shift_id: UUID | None) -> AttendanceRecord | None:
    stmt = select(AttendanceRecord).where(AttendanceRecord.employee_id == employee_id, AttendanceRecord.check_in_at.is_not(None), AttendanceRecord.check_out_at.is_(None))  # type: ignore[union-attr]
    if shift_id:
        stmt = stmt.where(AttendanceRecord.shift_id == shift_id)
    return (await ctx.session.exec(stmt.order_by(AttendanceRecord.occurred_at.desc()))).first()  # type: ignore[attr-defined]


async def check_out(ctx: RequestContext, ev: CheckEventIn, *, offline: bool = False) -> CheckResult:
    emp = await ctx.session.get(Employee, ctx.require_employee())
    assert emp is not None
    if (dup := await _by_event(ctx, emp.id, ev.client_event_id)) is not None:
        return await _result(ctx, dup)
    rec = await _open_record(ctx, emp.id, ev.shift_id)
    if rec is None:
        raise Conflict("You are not checked in", code="NO_OPEN_RECORD")
    site = (await ctx.session.get(Site, rec.site_id))
    assert site is not None
    shift = await ctx.session.get(Shift, rec.shift_id) if rec.shift_id else None
    cfg = await company_settings(ctx.session, ctx.company_id, "attendance")
    p = await _verify(ctx, emp, site, shift or None, ev, offline=offline, skip={"schedule"}, selfie_prefix_user=ctx.user.id, device_hash=ctx.device_hash)
    out = rules.check_out_result(shift.ends_at if shift else None, shift.early_leave_tol_min if shift else cfg["early_leave_tol_min"], cfg["overtime_threshold_min"], rec.check_in_at, p.when, shift.break_min if shift else 0)  # type: ignore[arg-type]
    rec.check_out_at, rec.out_point, rec.out_accuracy_m, rec.out_distance_m = p.when, wkt(ev.lng, ev.lat), ev.accuracy_m, p.distance_m
    rec.out_client_event_id, rec.checkout_note = ev.client_event_id, ev.note
    rec.early_min, rec.overtime_min, rec.worked_min = out.early_min or None, out.overtime_min or None, out.worked_min
    if out.status:
        rec.status = out.status
    if p.flags:
        rec.flags = _merge_flags(rec, p.flags)
        rec.flag_outcome = "pending"
    if ev.selfie_key:
        rec.selfie_keys = [*rec.selfie_keys, ev.selfie_key]
    rec.version += 1
    ctx.session.add(rec)
    await ctx.session.flush()
    if p.flags:
        await raise_for_record(ctx.session, rec, rec.flags)
    emit(ctx.session, ctx.company_id, "CheckOutRecorded", {"record_id": str(rec.id), "site_id": str(site.id), "employee_id": str(emp.id), "status": rec.status})
    return await _result(ctx, rec)


# --- offline sync ---------------------------------------------------------------------------------------


async def sync(ctx: RequestContext, events: list[CheckEventIn]) -> list[dict]:
    """Process in capture order; one bad event never blocks the others (each runs in a savepoint)."""
    results = []
    for ev in sorted(events, key=lambda e: e.captured_at):
        if ev.type is None:
            results.append({"client_event_id": ev.client_event_id, "ok": False, "error": {"code": "VALIDATION", "detail": "type is required"}})
            continue
        try:
            async with ctx.session.begin_nested():
                res = await (check_in if ev.type == "check_in" else check_out)(ctx, ev, offline=True)
            results.append({"client_event_id": ev.client_event_id, "ok": True, "result": res})
        except AppError as exc:
            results.append({"client_event_id": ev.client_event_id, "ok": False, "error": {"code": exc.code, "detail": exc.detail, **exc.extra}})
    return results


# --- proxy ----------------------------------------------------------------------------------------------


async def verify_pin(emp: Employee, pin: str) -> None:
    r = get_redis()
    if await r.exists(f"pin:lock:{emp.id}"):
        raise RateLimited("Too many wrong PINs. Try again in 15 minutes.", code="PIN_LOCKED", attempts_left=0)
    if emp.pin_hash and verify_password(pin, emp.pin_hash):
        await r.delete(f"pin:att:{emp.id}")
        return
    n = await r.incr(f"pin:att:{emp.id}")
    await r.expire(f"pin:att:{emp.id}", PIN_LOCK_S)
    if n >= PIN_MAX:
        await r.set(f"pin:lock:{emp.id}", "1", ex=PIN_LOCK_S)
        raise RateLimited("Too many wrong PINs. Try again in 15 minutes.", code="PIN_LOCKED", attempts_left=0)
    raise BusinessRule("Wrong PIN", code="PIN_INVALID", attempts_left=PIN_MAX - n)


async def _proxy_employee(ctx: RequestContext, body: ProxyIn) -> Employee:
    from staffsync.modules.employees.service import EmployeeRepository

    if body.badge_token:
        emp = (await ctx.session.exec(select(Employee).where(Employee.badge_token == body.badge_token, Employee.company_id == ctx.company_id))).first()
        if emp is None:
            raise NotFound("Badge not recognised")
        return await EmployeeRepository(ctx).get(emp.id)
    if body.employee_id:
        return await EmployeeRepository(ctx).get(body.employee_id)
    raise ValidationFailed("employee_id or badge_token is required")


async def proxy(ctx: RequestContext, body: ProxyIn, kind: str) -> CheckResult:
    from staffsync.common.enums import Perm

    ctx.require(Perm.ATTENDANCE_PROXY)
    site = await _site(ctx, body.site_id)
    ctx.ensure_site(site.id)
    emp = await _proxy_employee(ctx, body)
    if emp.status == "deactivated":
        raise Forbidden("Employee is deactivated", code="ACCOUNT_DISABLED")
    if (dup := await _by_event(ctx, emp.id, body.client_event_id)) is not None:
        return await _result(ctx, dup)
    cfg = await company_settings(ctx.session, ctx.company_id, "attendance")
    admin_mode = body.lat is None
    if admin_mode:
        ctx.require(Perm.ATTENDANCE_EDIT)  # dashboard live board: no GPS, but a reason is mandatory
        if not body.reason:
            raise ValidationFailed("A reason is required")
    else:
        inside, _ = await geo_queries.probe(ctx.session, site.id, body.lat, body.lng)  # type: ignore[arg-type]
        if not inside:
            raise BusinessRule("You must be on site to check an employee in", code="MANAGER_OUTSIDE")
    if body.pin is not None:
        await verify_pin(emp, body.pin)
    elif not admin_mode and cfg["proxy_requires_pin"] and not body.photo_key:
        raise ValidationFailed("The employee's PIN or a photo is required", code="PIN_REQUIRED")
    now = datetime.now(UTC)
    when = body.captured_at or now
    shift = await find_shift(ctx, emp.id, body.shift_id, site.id, when, cfg["shift_window_before_min"])
    flags: list[Flag] = []
    if shift is None:
        if not body.accept_unscheduled:
            raise UnscheduledError("This employee is not scheduled here.")
        flags.append(Flag("UNSCHEDULED"))
    lat, lng = (body.lat, body.lng) if not admin_mode else (None, None)
    if kind == "check_in":
        if (await ctx.session.exec(select(AttendanceRecord.id).where(AttendanceRecord.employee_id == emp.id, AttendanceRecord.check_in_at.is_not(None), AttendanceRecord.check_out_at.is_(None),  # type: ignore[union-attr]
                AttendanceRecord.occurred_at > now - timedelta(hours=20)))).first():
            raise Conflict("Already checked in", code="ALREADY_CHECKED_IN")
        res = rules.check_in_result(shift.starts_at if shift else None, shift.grace_min if shift else cfg["grace_min"], when)
        rec = AttendanceRecord(company_id=ctx.company_id, employee_id=emp.id, site_id=site.id, shift_id=shift.id if shift else None, occurred_at=when, check_in_at=when,
                               in_point=wkt(lng, lat) if lat is not None else None, in_accuracy_m=body.accuracy_m, method="admin" if admin_mode else "proxy", actor_user_id=ctx.user.id,
                               status=res.status, late_min=res.late_min or None, flags=[f.as_dict() for f in flags], flag_outcome="pending" if flags else None,
                               selfie_keys=[body.photo_key] if body.photo_key else [], client_event_id=body.client_event_id, notes=body.note or body.reason)
        ctx.session.add(rec)
        await ctx.session.flush()
        await raise_for_record(ctx.session, rec, rec.flags)
    else:
        rec = await _open_record(ctx, emp.id, shift.id if shift else None)
        if rec is None:
            raise Conflict("Not checked in", code="NO_OPEN_RECORD")
        out = rules.check_out_result(shift.ends_at if shift else None, shift.early_leave_tol_min if shift else cfg["early_leave_tol_min"], cfg["overtime_threshold_min"], rec.check_in_at, when, shift.break_min if shift else 0)  # type: ignore[arg-type]
        rec.check_out_at, rec.out_client_event_id, rec.checkout_note = when, body.client_event_id, body.note
        rec.early_min, rec.overtime_min, rec.worked_min = out.early_min or None, out.overtime_min or None, out.worked_min
        if lat is not None:
            rec.out_point = wkt(lng, lat)
        if out.status:
            rec.status = out.status
        rec.version += 1
        ctx.session.add(rec)
        await ctx.session.flush()
    audit(ctx, f"attendance.proxy_{kind}", "attendance", rec.id, after={"mode": "admin" if admin_mode else "proxy"}, reason=body.reason or body.note, employee_id=emp.id)
    emit(ctx.session, ctx.company_id, "CheckInRecorded" if kind == "check_in" else "CheckOutRecorded", {"record_id": str(rec.id), "site_id": str(site.id), "employee_id": str(emp.id), "status": rec.status, "flagged": bool(rec.flags)})
    return await _result(ctx, rec)
