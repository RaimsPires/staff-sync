from datetime import date
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Response
from pydantic import BaseModel, Field
from sqlmodel import select

from staffsync.common.enums import Perm
from staffsync.core.deps import require
from staffsync.core.errors import NotFound
from staffsync.modules.reports import service
from staffsync.modules.reports.models import SavedReport

router = APIRouter(prefix="/reports", tags=["reports"])


class Definition(BaseModel):
    type: str
    date_from: date
    date_to: date
    group_by: Literal["employee", "site", "branch", "day"] = "employee"
    site_ids: list[UUID] | None = None
    branch_ids: list[UUID] | None = None
    employee_ids: list[UUID] | None = None
    columns: list[str] | None = None
    range_key: str | None = None  # the preset the dates came from ("month", "last"...), kept so a saved report can be re-run


class ExportIn(Definition):
    format: Literal["csv", "xlsx", "pdf"] = "csv"


class SavedIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    definition: Definition
    schedule: dict | None = None  # {"frequency": "weekly|monthly", "recipients": [...], "format": "csv|xlsx|pdf"}


@router.get("/types")
async def types(ctx=require(Perm.REPORTS_VIEW)):
    return [{"type": k, "columns": v["columns"]} for k, v in service.TYPES.items()] + [{"group_by": list(service.GROUPS)}]


@router.post("/preview")
async def preview(body: Definition, ctx=require(Perm.REPORTS_VIEW)):
    return await service.build(ctx, body.type, body.date_from, body.date_to, body.group_by, body.site_ids, body.columns, body.branch_ids, body.employee_ids)


@router.post("/exports", status_code=201)
async def start_export(body: ExportIn, ctx=require(Perm.REPORTS_EXPORT, Perm.REPORTS_VIEW)):
    report = await service.build(ctx, body.type, body.date_from, body.date_to, body.group_by, body.site_ids, body.columns, body.branch_ids, body.employee_ids)
    from staffsync.core.audit import audit

    audit(ctx, "report.exported", "report", None, after={"type": body.type, "format": body.format})
    return {"id": await service.export(ctx, report, body.format), "status": "ready"}


@router.get("/exports/{export_id}")
async def get_export(export_id: str, ctx=require(Perm.REPORTS_EXPORT)):
    data, fmt = await service.fetch_export(ctx, export_id)
    return Response(data, media_type=service.MEDIA.get(fmt, "text/csv"), headers={"Content-Disposition": f'attachment; filename="report.{fmt}"'})


@router.get("/saved")
async def saved(ctx=require(Perm.REPORTS_VIEW)):
    rows = (await ctx.session.exec(select(SavedReport).where(SavedReport.company_id == ctx.company_id))).all()
    return [{"id": r.id, "name": r.name, "definition": r.definition, "schedule": r.schedule} for r in rows]


@router.post("/saved", status_code=201)
async def save(body: SavedIn, ctx=require(Perm.REPORTS_VIEW)):
    r = SavedReport(company_id=ctx.company_id, owner_user_id=ctx.user.id, name=body.name, definition=body.definition.model_dump(mode="json"), schedule=body.schedule)
    ctx.session.add(r)
    await ctx.session.flush()
    return {"id": r.id}


@router.patch("/saved/{report_id}")
async def update_saved(report_id: UUID, body: SavedIn, ctx=require(Perm.REPORTS_VIEW)):
    r = (await ctx.session.exec(select(SavedReport).where(SavedReport.id == report_id, SavedReport.company_id == ctx.company_id))).first()
    if r is None:
        raise NotFound()
    r.name, r.definition, r.schedule = body.name, body.definition.model_dump(mode="json"), body.schedule
    return {"id": r.id}


@router.delete("/saved/{report_id}", status_code=204)
async def delete_saved(report_id: UUID, ctx=require(Perm.REPORTS_VIEW)):
    r = (await ctx.session.exec(select(SavedReport).where(SavedReport.id == report_id, SavedReport.company_id == ctx.company_id))).first()
    if r is None:
        raise NotFound()
    await ctx.session.delete(r)
