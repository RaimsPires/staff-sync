"""Background jobs. Each takes a bypass-RLS session so it can work across tenants; they are plain coroutines
so tests call them directly and ARQ (workers/settings.py) schedules them."""

import json
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import delete, func, update
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from staffsync.core.logging import get_logger
from staffsync.core.messages import N_
from staffsync.core.outbox import OutboxEvent
from staffsync.core.redis import get_redis
from staffsync.modules.alerts.models import Alert
from staffsync.modules.attendance.models import AttendanceRecord
from staffsync.modules.auth.models import RefreshToken
from staffsync.modules.companies.models import Company
from staffsync.modules.employees.models import Employee
from staffsync.modules.notifications.models import Notification
from staffsync.modules.notifications.service import push_in_app
from staffsync.modules.realtime.router import channel
from staffsync.modules.schedules.models import Schedule, Shift
from staffsync.modules.settings.service import company_settings
from staffsync.modules.users_roles.models import RolePermission, UserRole
from staffsync.modules.users_roles.scope import resolve_access
from staffsync.modules.webhooks import service as webhooks
from staffsync.modules.webhooks.models import WebhookDelivery

log = get_logger("worker")

WEBHOOK_EVENT = {"CheckInRecorded": "attendance.checked_in", "CheckOutRecorded": "attendance.checked_out", "CheckInFlagged": "attendance.flagged", "LeaveRequested": "leave.requested",
                 "LeaveApproved": "leave.approved", "EmployeeCreated": "employee.created", "EmployeeDeactivated": "employee.deactivated"}
LIVE_EVENT = {"CheckInRecorded": "checkin", "CheckOutRecorded": "checkout", "CheckInFlagged": "flag"}


async def recipients(session: AsyncSession, company_id: UUID, site_id: UUID | None, perm: str) -> list[UUID]:
    """Users holding `perm` whose scope covers the site."""
    users = (await session.exec(select(UserRole.user_id).join(RolePermission, RolePermission.role_id == UserRole.role_id).where(UserRole.company_id == company_id, RolePermission.permission == perm).distinct())).all()
    out = []
    for uid in users:
        _, scope, _, _ = await resolve_access(session, company_id, uid)
        if site_id is None or scope.site_ids is None or site_id in scope.site_ids:
            out.append(uid)
    return out


async def handle_event(session: AsyncSession, ev: OutboxEvent) -> None:
    p, cid = ev.payload, ev.company_id
    r = get_redis()
    site_id = UUID(p["site_id"]) if p.get("site_id") else None
    if ev.event_type in LIVE_EVENT and site_id:
        await r.publish(channel(cid, site_id), json.dumps({"type": LIVE_EVENT[ev.event_type], **p}))
    if ev.event_type in ("LeaveApproved", "LeaveRequested", "LeaveDecided"):
        await r.publish(f"company:{cid}:all", json.dumps({"type": "leave", **p}))
    if ev.event_type == "CheckInFlagged":
        for uid in await recipients(session, cid, site_id, "alerts.view"):
            push_in_app(session, cid, uid, "fraud_flag", N_("Check-in flagged"), ", ".join(p.get("reasons", [])), href=f"/alerts/{p['alert_id']}")
    if ev.event_type == "LeaveRequested":
        for uid in await recipients(session, cid, None, "leave.approve"):
            push_in_app(session, cid, uid, "leave_request", N_("New leave request"), "", href=f"/leave/{p['request_id']}")
    if ev.event_type == "CorrectionRequested":
        for uid in await recipients(session, cid, site_id, "attendance.edit"):
            push_in_app(session, cid, uid, "correction", N_("Correction requested"), "", href="/attendance")
    if ev.event_type in ("EmployeeCreated", "EmployeeDeactivated"):
        from staffsync.modules.billing.service import sync_seats

        company = await session.get(Company, cid)
        if company:
            used = (await session.exec(select(func.count()).select_from(Employee).where(Employee.company_id == cid, Employee.status != "deactivated"))).one()
            try:
                await sync_seats(session, company, used)
            except Exception as exc:  # Stripe down must not block other events
                log.warning("seat_sync_failed", error=str(exc))
    if (name := WEBHOOK_EVENT.get(ev.event_type)):
        await webhooks.enqueue(session, cid, name, p)


async def relay_outbox(session: AsyncSession, batch: int = 100) -> int:
    rows = (await session.exec(select(OutboxEvent).where(OutboxEvent.status == "pending").order_by(OutboxEvent.created_at).limit(batch).with_for_update(skip_locked=True))).all()
    for ev in rows:
        ev.attempts += 1
        try:
            async with session.begin_nested():
                await handle_event(session, ev)
            ev.status, ev.sent_at = "sent", datetime.now(UTC)
        except Exception as exc:
            log.error("outbox_failed", id=str(ev.id), error=str(exc))
            if ev.attempts >= 5:
                ev.status = "failed"
    return len(rows)


async def deliver_webhooks(session: AsyncSession, batch: int = 50) -> int:
    rows = (await session.exec(select(WebhookDelivery).where(WebhookDelivery.status == "pending", WebhookDelivery.next_attempt_at <= datetime.now(UTC)).limit(batch).with_for_update(skip_locked=True))).all()
    for d in rows:
        await webhooks.deliver(session, d)
    return len(rows)


async def detect_absences(session: AsyncSession, now: datetime | None = None) -> int:
    """Shifts past start + grace with no check-in become Absent (unless on leave) and alert the site's managers."""
    now = now or datetime.now(UTC)
    shifts = (await session.exec(select(Shift).where(Shift.status == "scheduled", Shift.starts_at < now - timedelta(minutes=30), Shift.starts_at > now - timedelta(days=2)))).all()
    n = 0
    for sh in shifts:
        if now < sh.starts_at + timedelta(minutes=sh.grace_min):
            continue
        if (await session.exec(select(AttendanceRecord.id).where(AttendanceRecord.shift_id == sh.id).execution_options(include_deleted=True))).first():
            continue
        session.add(AttendanceRecord(company_id=sh.company_id, employee_id=sh.employee_id, site_id=sh.site_id, shift_id=sh.id, occurred_at=sh.starts_at, status="absent", method="system"))
        for uid in await recipients(session, sh.company_id, sh.site_id, "alerts.view"):
            push_in_app(session, sh.company_id, uid, "no_show", N_("No-show"), N_("An employee did not check in"), href="/attendance")
        n += 1
    return n


async def missing_checkouts(session: AsyncSession, now: datetime | None = None) -> int:
    """Open records past shift end + margin: reminder first, then a 'missing check-out' alert."""
    now = now or datetime.now(UTC)
    rows = (await session.exec(select(AttendanceRecord, Shift).join(Shift, Shift.id == AttendanceRecord.shift_id).where(AttendanceRecord.check_in_at.is_not(None), AttendanceRecord.check_out_at.is_(None),  # type: ignore[union-attr]
                                                                                                                         AttendanceRecord.status != "missing_checkout", Shift.ends_at < now))).all()
    n = 0
    for rec, sh in rows:
        cfg = await company_settings(session, rec.company_id, "attendance")
        if now < sh.ends_at + timedelta(minutes=cfg["missing_checkout_margin_min"]):
            continue
        emp = await session.get(Employee, rec.employee_id)
        if emp and (await get_redis().set(f"reminder:co:{rec.id}", "1", nx=True, ex=86400)):
            push_in_app(session, rec.company_id, emp.user_id, "checkout_reminder", N_("Don't forget to check out"), "", href=f"/attendance/{rec.id}")
            continue
        rec.status = "missing_checkout"
        session.add(Alert(company_id=rec.company_id, type="missing_checkout", record_id=rec.id, site_id=rec.site_id, employee_id=rec.employee_id, shift_id=sh.id, reasons=["MISSING_CHECKOUT"], severity="low"))
        n += 1
    return n


async def extend_shifts(session: AsyncSession) -> int:
    """Nightly: keep 8 weeks of shifts generated for every published schedule."""
    from staffsync.core.context import RequestContext, Scope
    from staffsync.modules.schedules import service as sched

    n = 0
    for s in (await session.exec(select(Schedule).where(Schedule.status == "published", Schedule.type == "recurring"))).all():
        if s.valid_to and s.valid_to < datetime.now(UTC).date():
            continue
        ctx = RequestContext(session=session, user=None, company_id=s.company_id, session_id=UUID(int=0), perms=frozenset(), scope=Scope())  # type: ignore[arg-type]
        n += await sched.regenerate(ctx, s)
    return n


async def retention(session: AsyncSession) -> dict:
    """Hard-delete short-lived technical data; anonymise soft-deleted employees past the trash period."""
    now = datetime.now(UTC)
    out = {}
    out["refresh_tokens"] = (await session.execute(delete(RefreshToken).where(RefreshToken.expires_at < now - timedelta(days=1)))).rowcount
    out["notifications"] = (await session.execute(delete(Notification).where(Notification.read_at < now - timedelta(days=180)))).rowcount
    out["outbox"] = (await session.execute(delete(OutboxEvent).where(OutboxEvent.status == "sent", OutboxEvent.sent_at < now - timedelta(days=30)))).rowcount
    out["selfies"] = (await session.execute(text_update_selfies(now))).rowcount
    out["anonymised"] = await anonymise_deleted_employees(session, now)
    return out


def text_update_selfies(now: datetime):
    return update(AttendanceRecord).where(AttendanceRecord.occurred_at < now - timedelta(days=90), func.cardinality(AttendanceRecord.selfie_keys) > 0).values(selfie_keys=[])  # TODO: also delete the S3 objects


async def anonymise_deleted_employees(session: AsyncSession, now: datetime) -> int:
    from staffsync.modules.auth.models import User

    n = 0
    for emp in (await session.exec(select(Employee).where(Employee.deleted_at.is_not(None)).execution_options(include_deleted=True))).all():  # type: ignore[union-attr]
        company = await session.get(Company, emp.company_id)
        if not company or emp.deleted_at > now - timedelta(days=company.retention_days):  # type: ignore[operator]
            continue
        user = await session.get(User, emp.user_id)
        if user and user.full_name != "Former employee":
            user.full_name, user.email, user.phone, user.password_hash, user.totp_secret = "Former employee", None, None, None, None
            emp.pin_hash, emp.badge_token, emp.photo_key = None, None, None
            n += 1
    return n


async def push_notifications(session: AsyncSession, batch: int = 200) -> int:
    """Send a phone notification for each new in-app notification, once. The in-app row is the source of truth."""
    from staffsync.modules.notifications.service import PUSH_PREF, push_later, push_tokens

    rows = (await session.exec(select(Notification).where(Notification.pushed_at.is_(None), Notification.created_at > datetime.now(UTC) - timedelta(hours=1)).order_by(Notification.created_at).limit(batch).with_for_update(skip_locked=True))).all()  # type: ignore[union-attr]
    for n in rows:
        push_later(await push_tokens(session, n.company_id, {n.user_id}, PUSH_PREF.get(n.type)), n.title, n.body, type=n.type, href=n.href or "")
        n.pushed_at = datetime.now(UTC)
        session.add(n)
    return len(rows)


async def billing_grace(session: AsyncSession) -> int:
    from staffsync.modules.billing.service import enforce_grace

    return await enforce_grace(session)


async def scheduled_reports(session: AsyncSession) -> int:
    from staffsync.modules.reports.scheduled import run_due

    return await run_due(session)
