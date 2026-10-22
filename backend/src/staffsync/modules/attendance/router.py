from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, Response

from staffsync.common.enums import Perm
from staffsync.common.schemas import Deletion, ReasonIn, deleted_flags
from staffsync.core.audit import audit
from staffsync.core.deps import require
from staffsync.core.errors import ValidationFailed
from staffsync.modules.attendance import admin, service
from staffsync.modules.attendance.models import AttendanceNote
from staffsync.modules.attendance.schemas import (
    BulkIn,
    CheckEventIn,
    CheckResult,
    CommentIn,
    LiveSite,
    ManualRecordIn,
    NoteIn,
    ProxyIn,
    RecordPatch,
    RecordRead,
    SyncIn,
    SyncItem,
    SyncOut,
    VerifyPinIn,
)
from staffsync.modules.employees.service import EmployeeRepository

router = APIRouter(tags=["attendance"])


def _version(v: str | None) -> int | None:
    try:
        return int(v.strip('"')) if v else None
    except ValueError as exc:
        raise ValidationFailed("Invalid If-Match header") from exc


# --- mobile: employee ----------------------------------------------------------------------------------


@router.post("/attendance/check-in", response_model=CheckResult)
async def check_in(body: CheckEventIn, ctx=require(employee=True)):
    return await service.check_in(ctx, body)


@router.post("/attendance/check-out", response_model=CheckResult)
async def check_out(body: CheckEventIn, ctx=require(employee=True)):
    return await service.check_out(ctx, body)


@router.post("/attendance/sync", response_model=SyncOut)
async def sync(body: SyncIn, ctx=require(employee=True)):
    items = await service.sync(ctx, body.events)
    return SyncOut(results=[SyncItem(**i) for i in items])


@router.get("/me/attendance")
async def my_month(month: Annotated[str, Query(pattern=r"^\d{4}-\d{2}$")], ctx=require(employee=True)):
    return await admin.month_view(ctx, ctx.require_employee(), month)


@router.get("/me/attendance/week-summary")
async def my_week(ctx=require(employee=True)):
    return await admin.week_summary(ctx, ctx.require_employee())


@router.get("/me/attendance/for-shift/{shift_id}", response_model=RecordRead | None)
async def my_for_shift(shift_id: UUID, ctx=require(employee=True)):
    from sqlmodel import select

    from staffsync.modules.attendance.models import AttendanceRecord

    rec = (await ctx.session.exec(select(AttendanceRecord).where(AttendanceRecord.shift_id == shift_id, AttendanceRecord.employee_id == ctx.require_employee()))).first()
    return (await service.to_read(ctx, [rec]))[0] if rec else None


@router.get("/me/attendance/{record_id}", response_model=RecordRead)
async def my_record(record_id: UUID, ctx=require(employee=True)):
    return (await service.to_read(ctx, [await service.own_record(ctx, record_id)]))[0]


@router.post("/me/attendance/{record_id}/comment", status_code=204)
async def my_comment(record_id: UUID, body: CommentIn, ctx=require(employee=True)):
    rec = await service.own_record(ctx, record_id)
    rec.employee_comment = body.comment
    ctx.session.add(rec)


# --- proxy ----------------------------------------------------------------------------------------------


@router.post("/attendance/proxy/verify-pin", status_code=204)
async def verify_pin(body: VerifyPinIn, ctx=require(Perm.ATTENDANCE_PROXY)):
    emp = await EmployeeRepository(ctx).get(body.employee_id)
    await service.verify_pin(emp, body.pin)


@router.post("/attendance/proxy/check-in", response_model=CheckResult)
async def proxy_in(body: ProxyIn, ctx=require(Perm.ATTENDANCE_PROXY)):
    return await service.proxy(ctx, body, "check_in")


@router.post("/attendance/proxy/check-out", response_model=CheckResult)
async def proxy_out(body: ProxyIn, ctx=require(Perm.ATTENDANCE_PROXY)):
    return await service.proxy(ctx, body, "check_out")


# --- admin -----------------------------------------------------------------------------------------------


@router.get("/attendance/live", response_model=list[LiveSite])
async def live(site_id: UUID | None = None, ctx=require(Perm.ATTENDANCE_VIEW)):
    return await admin.live(ctx, site_id)


@router.get("/attendance/export")
async def export(
    flags: Annotated[Deletion, Depends(deleted_flags)],
    format: Annotated[str, Query(pattern="^(csv|xlsx)$")] = "csv",
    date_from: Annotated[date | None, Query(alias="from")] = None,
    date_to: Annotated[date | None, Query(alias="to")] = None,
    site_id: UUID | None = None,
    branch_id: UUID | None = None,
    employee_id: UUID | None = None,
    status: str | None = None,
    method: str | None = None,
    flagged_only: bool = False,
    offline_only: bool = False,
    ctx=require(Perm.REPORTS_EXPORT, Perm.ATTENDANCE_VIEW),
):
    rows = await admin.export_rows(ctx, date_from=date_from, date_to=date_to, site_id=site_id, branch_id=branch_id, employee_id=employee_id, status=status, method=method,
                                   flagged_only=flagged_only, offline_only=offline_only, include_deleted=False, only_deleted=False)
    audit(ctx, "attendance.exported", "attendance", None, after={"rows": len(rows), "format": format})
    if format == "xlsx":
        return Response(admin.to_xlsx(rows), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": 'attachment; filename="attendance.xlsx"'})
    return Response(admin.to_csv(rows), media_type="text/csv", headers={"Content-Disposition": 'attachment; filename="attendance.csv"'})


@router.get("/attendance")
async def list_attendance(
    flags: Annotated[Deletion, Depends(deleted_flags)],
    date_from: Annotated[date | None, Query(alias="from")] = None,
    date_to: Annotated[date | None, Query(alias="to")] = None,
    site_id: UUID | None = None,
    branch_id: UUID | None = None,
    employee_id: UUID | None = None,
    status: str | None = None,
    method: str | None = None,
    flagged_only: bool = False,
    offline_only: bool = False,
    cursor: str | None = None,
    limit: int = 50,
    ctx=require(Perm.ATTENDANCE_VIEW),
):
    if (flags.include_deleted or flags.only_deleted) and not ctx.has(Perm.ATTENDANCE_EDIT):
        flags = Deletion()
    items, nxt = await admin.list_records(ctx, date_from=date_from, date_to=date_to, site_id=site_id, branch_id=branch_id, employee_id=employee_id, status=status, method=method,
                                          flagged_only=flagged_only, offline_only=offline_only, cursor=cursor, limit=limit, include_deleted=flags.include_deleted, only_deleted=flags.only_deleted)
    return {"items": items, "next_cursor": nxt}


@router.post("/attendance", response_model=RecordRead, status_code=201)
async def manual(body: ManualRecordIn, ctx=require(Perm.ATTENDANCE_EDIT)):
    return (await service.to_read(ctx, [await admin.manual_create(ctx, body)]))[0]


@router.post("/attendance/bulk")
async def bulk(body: BulkIn, ctx=require(Perm.ATTENDANCE_EDIT)):
    return await admin.bulk(ctx, body)


@router.get("/attendance/{record_id}")
async def get_record(record_id: UUID, response: Response, ctx=require(Perm.ATTENDANCE_VIEW)):
    rec = await service.AttendanceRepository(ctx).get(record_id, include_deleted=ctx.has(Perm.ATTENDANCE_EDIT))
    response.headers["ETag"] = f'"{rec.version}"'
    return await admin.detail(ctx, rec)


@router.patch("/attendance/{record_id}", response_model=RecordRead)
async def patch_record(record_id: UUID, body: RecordPatch, response: Response, if_match: Annotated[str | None, Header()] = None, ctx=require(Perm.ATTENDANCE_EDIT)):
    rec = await admin.patch(ctx, await service.AttendanceRepository(ctx).get(record_id), body, _version(if_match))
    response.headers["ETag"] = f'"{rec.version}"'
    return (await service.to_read(ctx, [rec]))[0]


@router.delete("/attendance/{record_id}", status_code=204)
async def delete_record(record_id: UUID, body: ReasonIn, ctx=require(Perm.ATTENDANCE_EDIT)):
    await admin.delete(ctx, await service.AttendanceRepository(ctx).get(record_id), body.reason)


@router.post("/attendance/{record_id}/restore", response_model=RecordRead)
async def restore_record(record_id: UUID, ctx=require(Perm.ATTENDANCE_EDIT)):
    rec = await service.AttendanceRepository(ctx).get(record_id, include_deleted=True)
    return (await service.to_read(ctx, [await admin.restore_record(ctx, rec)]))[0]


@router.post("/attendance/{record_id}/notes", status_code=201)
async def add_note(record_id: UUID, body: NoteIn, ctx=require(Perm.ATTENDANCE_VIEW)):
    rec = await service.AttendanceRepository(ctx).get(record_id)
    note = AttendanceNote(company_id=ctx.company_id, record_id=rec.id, author_user_id=ctx.user.id, body=body.body)
    ctx.session.add(note)
    await ctx.session.flush()
    return {"id": note.id, "author": ctx.user.full_name, "body": note.body, "created_at": note.created_at}


@router.get("/employees/{employee_id}/attendance")
async def employee_attendance(employee_id: UUID, month: Annotated[str, Query(pattern=r"^\d{4}-\d{2}$")], ctx=require(Perm.ATTENDANCE_VIEW)):
    emp = await EmployeeRepository(ctx).get(employee_id)
    return await admin.month_view(ctx, emp.id, month)
