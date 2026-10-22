
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from staffsync.core.outbox import emit
from staffsync.modules.alerts.models import Alert

HIGH = {"MOCK_LOCATION", "TIME_TAMPERED", "IMPOSSIBLE_TRAVEL", "DEVICE_MISMATCH"}


def severity_for(reasons: list[str]) -> str:
    return "high" if set(reasons) & HIGH else "medium" if reasons != ["UNSCHEDULED"] else "low"


async def raise_for_record(session: AsyncSession, record, flags: list[dict]) -> Alert | None:
    """One open alert per record; new flags are merged into it."""
    if not flags:
        return None
    reasons = sorted({f["reason"] for f in flags})
    alert = (await session.exec(select(Alert).where(Alert.record_id == record.id, Alert.status.in_(["open", "escalated"])))).first()  # type: ignore[attr-defined]
    if alert:
        alert.reasons = sorted(set(alert.reasons) | set(reasons))
        alert.severity = severity_for(alert.reasons)
        session.add(alert)
        return alert
    alert = Alert(
        company_id=record.company_id, type="unscheduled" if reasons == ["UNSCHEDULED"] else "flagged", record_id=record.id, site_id=record.site_id,
        employee_id=record.employee_id, shift_id=record.shift_id, reasons=reasons, severity=severity_for(reasons),
    )
    session.add(alert)
    await session.flush()
    emit(session, record.company_id, "CheckInFlagged", {"record_id": str(record.id), "alert_id": str(alert.id), "site_id": str(record.site_id), "employee_id": str(record.employee_id), "reasons": reasons})
    return alert
