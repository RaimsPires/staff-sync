from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter
from sqlmodel import select

from staffsync.common.enums import Perm
from staffsync.core.audit import audit
from staffsync.core.deps import require
from staffsync.core.errors import Conflict, NotFound
from staffsync.core.outbox import emit
from staffsync.modules.alerts.models import Alert
from staffsync.modules.alerts.service_resolve import resolve_alert
from staffsync.modules.attendance import admin
from staffsync.modules.attendance.schemas import RecordPatch
from staffsync.modules.attendance.service import AttendanceRepository, own_record
from staffsync.modules.corrections.models import CorrectionRequest
from staffsync.modules.corrections.schemas import AcceptIn, CorrectionIn, CorrectionRead, DeclineIn
from staffsync.modules.employees.models import Employee
from staffsync.modules.notifications.service import push_in_app

router = APIRouter(tags=["corrections"])

ALLOWED = {"pending": {"accepted", "declined", "cancelled"}}


def _to(c: CorrectionRequest) -> CorrectionRead:
    return CorrectionRead(**c.model_dump(include=set(CorrectionRead.model_fields)))


def _move(c: CorrectionRequest, to: str) -> None:
    if to not in ALLOWED.get(c.status, set()):
        raise Conflict(f"Cannot go from {c.status} to {to}", code="INVALID_TRANSITION")
    c.status = to


@router.post("/me/attendance/{record_id}/corrections", response_model=CorrectionRead, status_code=201)
async def request_correction(record_id: UUID, body: CorrectionIn, ctx=require(employee=True)):
    rec = await own_record(ctx, record_id)
    if (await ctx.session.exec(select(CorrectionRequest.id).where(CorrectionRequest.record_id == rec.id, CorrectionRequest.status == "pending"))).first():
        raise Conflict("A correction is already pending for this record", code="ALREADY_PENDING")
    c = CorrectionRequest(company_id=ctx.company_id, record_id=rec.id, employee_id=rec.employee_id, **body.model_dump())
    ctx.session.add(c)
    await ctx.session.flush()
    emit(ctx.session, ctx.company_id, "CorrectionRequested", {"id": str(c.id), "record_id": str(rec.id), "site_id": str(rec.site_id)})
    return _to(c)


@router.get("/me/corrections", response_model=list[CorrectionRead])
async def my_corrections(record_id: UUID | None = None, ctx=require(employee=True)):
    stmt = select(CorrectionRequest).where(CorrectionRequest.employee_id == ctx.require_employee()).order_by(CorrectionRequest.created_at.desc())  # type: ignore[attr-defined]
    if record_id:
        stmt = stmt.where(CorrectionRequest.record_id == record_id)
    return [_to(c) for c in (await ctx.session.exec(stmt)).all()]


@router.post("/me/corrections/{correction_id}/cancel", response_model=CorrectionRead)
async def cancel(correction_id: UUID, ctx=require(employee=True)):
    c = (await ctx.session.exec(select(CorrectionRequest).where(CorrectionRequest.id == correction_id, CorrectionRequest.employee_id == ctx.require_employee()))).first()
    if c is None:
        raise NotFound()
    _move(c, "cancelled")
    return _to(c)


async def _scoped(ctx, cid: UUID) -> CorrectionRequest:
    c = (await ctx.session.exec(select(CorrectionRequest).where(CorrectionRequest.id == cid, CorrectionRequest.company_id == ctx.company_id))).first()
    if c is None:
        raise NotFound()
    await AttendanceRepository(ctx).get(c.record_id)  # scope check via the record's site
    return c


@router.get("/corrections", response_model=list[CorrectionRead])
async def list_corrections(status: str = "pending", ctx=require(Perm.ATTENDANCE_EDIT)):
    rows = (await ctx.session.exec(select(CorrectionRequest).where(CorrectionRequest.company_id == ctx.company_id, CorrectionRequest.status == status)
            .where(CorrectionRequest.record_id.in_(AttendanceRepository(ctx).query().with_only_columns(AttendanceRecord_id())))  # scoped by site
            .order_by(CorrectionRequest.created_at))).all()
    return [_to(c) for c in rows]


def AttendanceRecord_id():
    from staffsync.modules.attendance.models import AttendanceRecord

    return AttendanceRecord.id


async def _notify(ctx, c: CorrectionRequest, title: str, body: str) -> None:
    emp = await ctx.session.get(Employee, c.employee_id)
    if emp:
        push_in_app(ctx.session, ctx.company_id, emp.user_id, "correction_result", title, body, href=f"/attendance/{c.record_id}")


@router.post("/corrections/{correction_id}/accept", response_model=CorrectionRead)
async def accept(correction_id: UUID, body: AcceptIn, ctx=require(Perm.ATTENDANCE_EDIT)):
    c = await _scoped(ctx, correction_id)
    _move(c, "accepted")
    rec = await AttendanceRepository(ctx).get(c.record_id)
    if c.kind == "flagged_incorrectly":
        alert = (await ctx.session.exec(select(Alert).where(Alert.record_id == rec.id, Alert.status.in_(["open", "escalated"])))).first()  # type: ignore[attr-defined]
        if alert:
            await resolve_alert(ctx, alert, "approved", body.note or "Correction accepted")
    else:
        patch = {k: v for k, v in {"check_in_at": c.proposed_in, "check_out_at": c.proposed_out}.items() if v is not None}
        await admin.patch(ctx, rec, RecordPatch(reason=f"Correction accepted: {c.comment}"[:500], **patch), None)
    c.decided_by, c.decided_at, c.admin_response = ctx.user.id, datetime.now(UTC), body.note
    audit(ctx, "correction.accepted", "correction", c.id, reason=body.note, employee_id=c.employee_id)
    await _notify(ctx, c, "Correction accepted", body.note or "")
    return _to(c)


@router.post("/corrections/{correction_id}/decline", response_model=CorrectionRead)
async def decline(correction_id: UUID, body: DeclineIn, ctx=require(Perm.ATTENDANCE_EDIT)):
    c = await _scoped(ctx, correction_id)
    _move(c, "declined")
    c.decided_by, c.decided_at, c.admin_response = ctx.user.id, datetime.now(UTC), body.reason
    audit(ctx, "correction.declined", "correction", c.id, reason=body.reason, employee_id=c.employee_id)
    await _notify(ctx, c, "Correction declined", body.reason)
    return _to(c)
