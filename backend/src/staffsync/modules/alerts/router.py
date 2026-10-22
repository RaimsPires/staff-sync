from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, text
from sqlmodel import select

from staffsync.common.enums import Perm
from staffsync.common.repository import TenantRepository
from staffsync.core.adapters import get_storage
from staffsync.core.audit import audit
from staffsync.core.deps import require
from staffsync.modules.alerts.models import Alert, AlertNote
from staffsync.modules.alerts.service_resolve import resolve_alert, transition
from staffsync.modules.attendance.models import AttendanceRecord
from staffsync.modules.attendance.service import to_read as records_to_read
from staffsync.modules.auth.models import User
from staffsync.modules.employees.models import Device, Employee

router = APIRouter(prefix="/alerts", tags=["alerts"])

TABS = {
    "flagged": (["flagged"], ["open", "escalated"]),
    "missing_checkout": (["missing_checkout"], ["open", "escalated"]),
    "unscheduled": (["unscheduled"], ["open", "escalated"]),
    "uncovered": (["uncovered_intervention"], ["open", "escalated"]),
}


class AlertRepository(TenantRepository[Alert]):
    model = Alert

    def query(self, **kw):
        stmt = select(Alert).where(Alert.company_id == self.ctx.company_id)
        ids = self.ctx.scope.site_ids
        if ids is not None:
            stmt = stmt.where(Alert.site_id.in_(set(ids))) if ids else stmt.where(Alert.id.is_(None))
        return stmt


class ResolveIn(BaseModel):
    reason: str = Field(min_length=3, max_length=1000)


class EscalateIn(BaseModel):
    assign_to: UUID
    note: str | None = None


class NoteIn(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class BulkResolveIn(BaseModel):
    ids: list[UUID] = Field(min_length=1, max_length=100)
    outcome: str = Field(pattern="^(approved|rejected)$")
    reason: str = Field(min_length=3, max_length=1000)


def _read(a: Alert, names: dict) -> dict:
    return {"id": a.id, "type": a.type, "record_id": a.record_id, "site_id": a.site_id, "employee_id": a.employee_id, "employee_name": names.get(a.employee_id), "reasons": a.reasons,
            "severity": a.severity, "status": a.status, "assigned_to": a.assigned_to, "resolution_note": a.resolution_note, "resolved_at": a.resolved_at, "created_at": a.created_at}


async def _names(ctx, alerts: list[Alert]) -> dict:
    ids = {a.employee_id for a in alerts if a.employee_id}
    if not ids:
        return {}
    return dict((await ctx.session.exec(select(Employee.id, User.full_name).join(User, User.id == Employee.user_id).where(Employee.id.in_(ids)).execution_options(include_deleted=True))).all())  # type: ignore[attr-defined]


@router.get("")
async def list_alerts(tab: Annotated[str, Query(pattern="^(flagged|missing_checkout|unscheduled|uncovered|resolved|all)$")] = "flagged", site_id: UUID | None = None,
                      limit: Annotated[int, Query(ge=1, le=200)] = 100, offset: int = 0, ctx=require(Perm.ALERTS_VIEW)):
    stmt = AlertRepository(ctx).query().order_by(Alert.created_at.desc())  # type: ignore[attr-defined]
    if tab == "resolved":
        stmt = stmt.where(Alert.status.in_(["approved", "rejected"]))  # type: ignore[attr-defined]
    elif tab != "all":
        types, statuses = TABS[tab]
        stmt = stmt.where(Alert.type.in_(types), Alert.status.in_(statuses))  # type: ignore[attr-defined]
    if site_id:
        stmt = stmt.where(Alert.site_id == site_id)
    rows = list((await ctx.session.exec(stmt.limit(limit).offset(offset))).all())
    names = await _names(ctx, rows)
    counts = dict((await ctx.session.execute(select(Alert.type, func.count()).where(Alert.company_id == ctx.company_id, Alert.status.in_(["open", "escalated"])).group_by(Alert.type))).all())  # type: ignore[attr-defined]
    return {"items": [_read(a, names) for a in rows], "open_counts": counts}


@router.get("/{alert_id}")
async def alert_detail(alert_id: UUID, ctx=require(Perm.ALERTS_VIEW)):
    a = await AlertRepository(ctx).get(alert_id)
    out = {"alert": _read(a, await _names(ctx, [a])), "record": None, "evidence": None, "notes": []}
    if a.record_id:
        rec = (await ctx.session.exec(select(AttendanceRecord).where(AttendanceRecord.id == a.record_id))).first()
        if rec:
            pts = (await ctx.session.execute(text("SELECT ST_Y(in_point::geometry) lat, ST_X(in_point::geometry) lng FROM attendance_records WHERE id=:i"), {"i": rec.id})).one()
            past = (await ctx.session.exec(select(func.count()).select_from(Alert).where(Alert.employee_id == a.employee_id, Alert.id != a.id, Alert.type.in_(["flagged", "unscheduled"])))).one()
            dev = (await ctx.session.exec(select(Device).where(Device.employee_id == rec.employee_id).order_by(Device.registered_at.desc()))).first()  # type: ignore[attr-defined]
            out["record"] = (await records_to_read(ctx, [rec]))[0]
            out["evidence"] = {"point": {"lat": pts.lat, "lng": pts.lng} if pts.lat is not None else None, "distance_m": rec.distance_m, "accuracy_m": rec.in_accuracy_m,
                               "device": {"model": dev.model, "platform": dev.platform, "app_version": dev.app_version} if dev else None,
                               "selfie_urls": [await get_storage().presign_get(k, 300) for k in rec.selfie_keys], "employee_comment": rec.employee_comment, "past_flags": past}
    notes = (await ctx.session.exec(select(AlertNote, User).join(User, User.id == AlertNote.author_user_id).where(AlertNote.alert_id == a.id).order_by(AlertNote.created_at))).all()  # type: ignore[attr-defined]
    out["notes"] = [{"id": n.id, "author": u.full_name, "body": n.body, "created_at": n.created_at} for n, u in notes]
    return out


@router.post("/{alert_id}/approve")
async def approve(alert_id: UUID, body: ResolveIn, ctx=require(Perm.ALERTS_RESOLVE)):
    a = await resolve_alert(ctx, await AlertRepository(ctx).get(alert_id), "approved", body.reason)
    return _read(a, {})


@router.post("/{alert_id}/reject")
async def reject(alert_id: UUID, body: ResolveIn, ctx=require(Perm.ALERTS_RESOLVE)):
    a = await resolve_alert(ctx, await AlertRepository(ctx).get(alert_id), "rejected", body.reason)
    return _read(a, {})


@router.post("/{alert_id}/escalate")
async def escalate(alert_id: UUID, body: EscalateIn, ctx=require(Perm.ALERTS_RESOLVE)):
    a = await AlertRepository(ctx).get(alert_id)
    transition(a, "escalated")
    a.assigned_to = body.assign_to
    ctx.session.add(a)
    if body.note:
        ctx.session.add(AlertNote(company_id=ctx.company_id, alert_id=a.id, author_user_id=ctx.user.id, body=body.note))
    audit(ctx, "alert.escalated", "alert", a.id, after={"assigned_to": str(body.assign_to)}, employee_id=a.employee_id)
    return _read(a, {})


@router.post("/{alert_id}/notes", status_code=201)
async def add_note(alert_id: UUID, body: NoteIn, ctx=require(Perm.ALERTS_VIEW)):
    a = await AlertRepository(ctx).get(alert_id)
    n = AlertNote(company_id=ctx.company_id, alert_id=a.id, author_user_id=ctx.user.id, body=body.body)
    ctx.session.add(n)
    await ctx.session.flush()
    return {"id": n.id, "author": ctx.user.full_name, "body": n.body, "created_at": n.created_at}


@router.post("/bulk-resolve")
async def bulk_resolve(body: BulkResolveIn, ctx=require(Perm.ALERTS_RESOLVE)):
    done, failed = [], []
    for aid in body.ids:
        try:
            async with ctx.session.begin_nested():
                await resolve_alert(ctx, await AlertRepository(ctx).get(aid), body.outcome, body.reason)
            done.append(aid)
        except Exception as exc:
            failed.append({"id": aid, "error": getattr(exc, "code", "ERROR")})
    return {"resolved": done, "failed": failed}
