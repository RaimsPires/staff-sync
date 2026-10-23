"""Alert state machine: open -> approved | rejected, open -> escalated -> approved | rejected."""

from datetime import UTC, datetime

from staffsync.core.audit import audit
from staffsync.core.context import RequestContext
from staffsync.core.errors import Conflict
from staffsync.core.messages import N_
from staffsync.core.outbox import emit
from staffsync.modules.alerts.models import Alert
from staffsync.modules.attendance.models import AttendanceRecord
from staffsync.modules.employees.models import Employee
from staffsync.modules.notifications.service import push_in_app

ALLOWED = {"open": {"approved", "rejected", "escalated"}, "escalated": {"approved", "rejected"}, "approved": set(), "rejected": set()}


def transition(alert: Alert, to: str) -> None:
    if to not in ALLOWED.get(alert.status, set()):
        raise Conflict(f"Cannot go from {alert.status} to {to}", code="INVALID_TRANSITION", from_status=alert.status, to_status=to)
    alert.status = to


async def resolve_alert(ctx: RequestContext, alert: Alert, outcome: str, note: str) -> Alert:
    transition(alert, outcome)
    alert.resolved_by, alert.resolved_at, alert.resolution_note = ctx.user.id, datetime.now(UTC), note
    ctx.session.add(alert)
    rec = await ctx.session.get(AttendanceRecord, alert.record_id) if alert.record_id else None
    if rec is not None:
        rec.flag_outcome = outcome
        if outcome == "rejected" and alert.type in ("flagged", "unscheduled"):
            rec.status = "absent"  # the day becomes absent/invalid
        rec.version += 1
        ctx.session.add(rec)
        emp = await ctx.session.get(Employee, rec.employee_id)
        if emp:
            push_in_app(ctx.session, ctx.company_id, emp.user_id, "flag_update", N_("Check-in approved") if outcome == "approved" else N_("Check-in rejected"), note, href=f"/attendance/{rec.id}")
    audit(ctx, f"alert.{outcome}", "alert", alert.id, reason=note, employee_id=alert.employee_id)
    emit(ctx.session, ctx.company_id, "AlertResolved", {"alert_id": str(alert.id), "outcome": outcome})
    return alert
