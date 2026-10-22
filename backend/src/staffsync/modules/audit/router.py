import csv
import io
from datetime import UTC, date, datetime, timedelta
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, Response
from sqlalchemy import and_, or_
from sqlmodel import select

from staffsync.common.enums import Perm
from staffsync.common.pagination import build_page, clamp_limit, decode_cursor
from staffsync.core.deps import require
from staffsync.modules.audit.models import AuditLog

router = APIRouter(tags=["audit"])


def _filtered(ctx, action, target_type, actor, employee_id, date_from, date_to):
    stmt = select(AuditLog).where(AuditLog.company_id == ctx.company_id)
    if action:
        stmt = stmt.where(AuditLog.action.like(f"{action}%"))
    if target_type:
        stmt = stmt.where(AuditLog.target_type == target_type)
    if actor:
        stmt = stmt.where(AuditLog.actor_user_id == actor)
    if employee_id:
        stmt = stmt.where(AuditLog.employee_id == employee_id)
    if date_from:
        stmt = stmt.where(AuditLog.created_at >= datetime.combine(date_from, datetime.min.time(), UTC))
    if date_to:
        stmt = stmt.where(AuditLog.created_at < datetime.combine(date_to + timedelta(days=1), datetime.min.time(), UTC))
    return stmt


def _out(a: AuditLog) -> dict:
    return {"id": a.id, "at": a.created_at, "actor_id": a.actor_user_id, "actor_name": a.actor_name, "actor_role": a.actor_role, "action": a.action, "target_type": a.target_type, "target_id": a.target_id,
            "before": a.before, "after": a.after, "reason": a.reason, "ip": a.ip, "user_agent": a.user_agent}


@router.get("/audit-logs")
async def list_logs(action: str | None = None, target_type: str | None = None, actor: UUID | None = None, employee_id: UUID | None = None,
                    date_from: Annotated[date | None, Query(alias="from")] = None, date_to: Annotated[date | None, Query(alias="to")] = None,
                    cursor: str | None = None, limit: int = 50, ctx=require(Perm.AUDIT_VIEW)):
    limit = clamp_limit(limit)
    stmt = _filtered(ctx, action, target_type, actor, employee_id, date_from, date_to)
    cur = decode_cursor(cursor)
    if cur:
        stmt = stmt.where(or_(AuditLog.created_at < cur[0], and_(AuditLog.created_at == cur[0], AuditLog.id < cur[1])))
    rows = list((await ctx.session.exec(stmt.order_by(AuditLog.created_at.desc(), AuditLog.id.desc()).limit(limit + 1))).all())  # type: ignore[attr-defined]
    rows, nxt = build_page(rows, limit, lambda r: (r.created_at, r.id))
    return {"items": [_out(a) for a in rows], "next_cursor": nxt}


@router.get("/audit-logs/export")
async def export_logs(action: str | None = None, date_from: Annotated[date | None, Query(alias="from")] = None, date_to: Annotated[date | None, Query(alias="to")] = None,
                      ctx=require(Perm.AUDIT_VIEW, Perm.REPORTS_EXPORT)):
    rows = (await ctx.session.exec(_filtered(ctx, action, None, None, None, date_from, date_to).order_by(AuditLog.created_at.desc()).limit(50_000))).all()  # type: ignore[attr-defined]
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["at", "actor", "role", "action", "target_type", "target_id", "reason", "ip"])
    for a in rows:
        w.writerow([a.created_at.isoformat(), *(("'" + v if isinstance(v, str) and v[:1] in "=+-@" else v) for v in (a.actor_name, a.actor_role, a.action, a.target_type, a.target_id, a.reason, a.ip))])
    return Response(buf.getvalue().encode("utf-8-sig"), media_type="text/csv", headers={"Content-Disposition": 'attachment; filename="audit-log.csv"'})


@router.get("/employees/{employee_id}/activity")
async def employee_activity(employee_id: UUID, ctx=require(Perm.AUDIT_VIEW)):
    from staffsync.modules.employees.service import EmployeeRepository

    emp = await EmployeeRepository(ctx).get(employee_id)
    rows = (await ctx.session.exec(select(AuditLog).where(AuditLog.company_id == ctx.company_id, AuditLog.employee_id == emp.id).order_by(AuditLog.created_at.desc()).limit(200))).all()  # type: ignore[attr-defined]
    return [_out(a) for a in rows]
