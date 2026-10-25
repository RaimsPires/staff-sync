from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query
from sqlalchemy import func
from sqlmodel import select

from staffsync.common.enums import Perm
from staffsync.common.softdelete import restore, soft_delete
from staffsync.core.audit import audit
from staffsync.core.deps import require
from staffsync.core.errors import Conflict, NotFound
from staffsync.modules.employees.models import Employee
from staffsync.modules.leave import service
from staffsync.modules.leave.models import Holiday, HolidayCalendar, LeaveBalance, LeaveRequest, LeaveType
from staffsync.modules.leave.schemas import (
    AdjustIn,
    BulkDecisionIn,
    CalendarIn,
    DecisionIn,
    HolidayIn,
    LeaveDraft,
    LeaveRead,
    LeaveTypeIn,
    LeaveTypePatch,
    LeaveTypeRead,
    PreviewOut,
    RecommendIn,
)

router = APIRouter(tags=["leave"])


async def _my_emp(ctx) -> Employee:
    emp = await ctx.session.get(Employee, ctx.require_employee())
    assert emp is not None
    return emp


async def _my_request(ctx, request_id: UUID) -> LeaveRequest:
    req = (await ctx.session.exec(select(LeaveRequest).where(LeaveRequest.id == request_id, LeaveRequest.employee_id == ctx.require_employee()))).first()
    if req is None:
        raise NotFound()
    return req


def _type_read(t: LeaveType) -> LeaveTypeRead:
    return LeaveTypeRead(**t.model_dump(include=set(LeaveTypeIn.model_fields)), id=t.id, deleted_at=t.deleted_at.isoformat() if t.deleted_at else None)


# --- types / holidays --------------------------------------------------------------------------------------


@router.get("/leave/types", response_model=list[LeaveTypeRead])
async def list_types(only_deleted: bool = False, ctx=require()):
    stmt = select(LeaveType).where(LeaveType.company_id == ctx.company_id).order_by(LeaveType.name_en)
    if only_deleted and ctx.has(Perm.LEAVE_SETTINGS):
        stmt = select(LeaveType).where(LeaveType.company_id == ctx.company_id, LeaveType.deleted_at.is_not(None)).execution_options(include_deleted=True)  # type: ignore[attr-defined]
    return [_type_read(t) for t in (await ctx.session.exec(stmt)).all()]


@router.post("/leave/types", response_model=LeaveTypeRead, status_code=201)
async def create_type(body: LeaveTypeIn, ctx=require(Perm.LEAVE_SETTINGS)):
    t = LeaveType(company_id=ctx.company_id, **body.model_dump())
    ctx.session.add(t)
    await ctx.session.flush()
    audit(ctx, "leave_type.created", "leave_type", t.id, after=body)
    return _type_read(t)


@router.patch("/leave/types/{type_id}", response_model=LeaveTypeRead)
async def patch_type(type_id: UUID, body: LeaveTypePatch, ctx=require(Perm.LEAVE_SETTINGS)):
    t = await service.get_type(ctx, type_id)
    data = body.model_dump(exclude_unset=True)
    before = {k: getattr(t, k) for k in data}
    for k, v in data.items():
        setattr(t, k, v)
    audit(ctx, "leave_type.updated", "leave_type", t.id, before=before, after=data)
    return _type_read(t)


@router.delete("/leave/types/{type_id}", status_code=204)
async def delete_type(type_id: UUID, body: dict, ctx=require(Perm.LEAVE_SETTINGS)):
    t = await service.get_type(ctx, type_id)
    used = (await ctx.session.exec(select(func.count()).select_from(LeaveBalance).where(LeaveBalance.leave_type_id == t.id, (LeaveBalance.used > 0) | (LeaveBalance.pending > 0)))).one()
    if used:
        raise Conflict("Balances still use this type", code="TYPE_IN_USE")
    soft_delete(ctx, t, body.get("reason", ""), entity="leave_type")


@router.post("/leave/types/{type_id}/restore", response_model=LeaveTypeRead)
async def restore_type(type_id: UUID, ctx=require(Perm.LEAVE_SETTINGS)):
    t = (await ctx.session.exec(select(LeaveType).where(LeaveType.id == type_id, LeaveType.company_id == ctx.company_id).execution_options(include_deleted=True))).first()
    if t is None:
        raise NotFound()
    restore(ctx, t, entity="leave_type")
    return _type_read(t)


@router.get("/holidays/calendars")
async def calendars(ctx=require(Perm.LEAVE_VIEW)):
    cals = (await ctx.session.exec(select(HolidayCalendar).where(HolidayCalendar.company_id == ctx.company_id))).all()
    return [{"id": c.id, "name": c.name} for c in cals]


@router.post("/holidays/calendars", status_code=201)
async def create_calendar(body: CalendarIn, ctx=require(Perm.LEAVE_SETTINGS)):
    c = HolidayCalendar(company_id=ctx.company_id, name=body.name)
    ctx.session.add(c)
    await ctx.session.flush()
    return {"id": c.id, "name": c.name}


@router.get("/holidays")
async def list_holidays(calendar_id: UUID, year: int | None = None, ctx=require(Perm.LEAVE_VIEW)):
    stmt = select(Holiday).where(Holiday.calendar_id == calendar_id, Holiday.company_id == ctx.company_id).order_by(Holiday.date)
    if year:
        stmt = stmt.where(Holiday.date >= date(year, 1, 1), Holiday.date <= date(year, 12, 31))
    return [{"id": h.id, "date": h.date, "name": h.name} for h in (await ctx.session.exec(stmt)).all()]


@router.post("/holidays", status_code=201)
async def add_holiday(body: HolidayIn, ctx=require(Perm.LEAVE_SETTINGS)):
    cal = (await ctx.session.exec(select(HolidayCalendar).where(HolidayCalendar.id == body.calendar_id, HolidayCalendar.company_id == ctx.company_id))).first()
    if cal is None:
        raise NotFound("Calendar not found")
    h = Holiday(company_id=ctx.company_id, calendar_id=cal.id, date=body.date, name=body.name)
    ctx.session.add(h)
    try:
        await ctx.session.flush()
    except Exception as exc:
        raise Conflict("A holiday already exists on this date", code="DUPLICATE") from exc
    return {"id": h.id}


@router.delete("/holidays/{holiday_id}", status_code=204)
async def delete_holiday(holiday_id: UUID, ctx=require(Perm.LEAVE_SETTINGS)):
    h = (await ctx.session.exec(select(Holiday).where(Holiday.id == holiday_id, Holiday.company_id == ctx.company_id))).first()
    if h is None:
        raise NotFound()
    soft_delete(ctx, h, "removed", entity="holiday")


# --- employee (mobile) --------------------------------------------------------------------------------------


@router.get("/me/leave/balances")
async def my_balances(year: int | None = None, ctx=require(employee=True)):
    from datetime import UTC, datetime

    return await service.balances(ctx, ctx.require_employee(), year or datetime.now(UTC).year)


@router.post("/me/leave/requests/preview", response_model=PreviewOut)
async def my_preview(body: LeaveDraft, ctx=require(employee=True)):
    return await service.preview(ctx, await _my_emp(ctx), body)


@router.post("/me/leave/requests", response_model=LeaveRead, status_code=201)
async def my_submit(body: LeaveDraft, ctx=require(employee=True)):
    req = await service.submit(ctx, await _my_emp(ctx), body)
    return (await service.to_read(ctx, [req], with_timeline=True))[0]


@router.get("/me/leave/requests", response_model=list[LeaveRead])
async def my_requests(ctx=require(employee=True)):
    rows = (await ctx.session.exec(select(LeaveRequest).where(LeaveRequest.employee_id == ctx.require_employee()).order_by(LeaveRequest.start_date.desc()))).all()  # type: ignore[attr-defined]
    return await service.to_read(ctx, list(rows), with_timeline=True)


@router.get("/me/leave/approved")
async def my_approved(from_: Annotated[date, Query(alias="from")], to: date, ctx=require(employee=True)):
    rows = (await ctx.session.exec(select(LeaveRequest).where(LeaveRequest.employee_id == ctx.require_employee(), LeaveRequest.status == "approved", LeaveRequest.start_date <= to, LeaveRequest.end_date >= from_))).all()
    return [{"start": r.start_date, "end": r.end_date, "leave_type_id": r.leave_type_id} for r in rows]


@router.get("/me/leave/requests/{request_id}", response_model=LeaveRead)
async def my_request(request_id: UUID, ctx=require(employee=True)):
    return (await service.to_read(ctx, [await _my_request(ctx, request_id)], with_timeline=True))[0]


@router.patch("/me/leave/requests/{request_id}", response_model=LeaveRead)
async def my_edit(request_id: UUID, body: LeaveDraft, ctx=require(employee=True)):
    req = await service.edit(ctx, await _my_emp(ctx), await _my_request(ctx, request_id), body)
    return (await service.to_read(ctx, [req], with_timeline=True))[0]


@router.post("/me/leave/requests/{request_id}/cancel", response_model=LeaveRead)
async def my_cancel(request_id: UUID, body: DecisionIn, ctx=require(employee=True)):
    req = await service.employee_cancel(ctx, await _my_emp(ctx), await _my_request(ctx, request_id), body.comment)
    return (await service.to_read(ctx, [req], with_timeline=True))[0]


# --- inbox (dashboard + site managers) --------------------------------------------------------------------------


@router.get("/leave/requests")
async def inbox(
    status: str | None = None,
    leave_type_id: UUID | None = None,
    site_id: UUID | None = None,
    employee_id: UUID | None = None,
    waiting_on_me: bool = False,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
    ctx=require(Perm.LEAVE_VIEW),
):
    stmt = service.LeaveRepository(ctx).query().order_by(LeaveRequest.created_at.desc())  # type: ignore[attr-defined]
    if status:
        stmt = stmt.where(LeaveRequest.status.in_(status.split(",")))  # type: ignore[attr-defined]
    if leave_type_id:
        stmt = stmt.where(LeaveRequest.leave_type_id == leave_type_id)
    if employee_id:
        stmt = stmt.where(LeaveRequest.employee_id == employee_id)
    if site_id:
        from staffsync.modules.employees.models import EmployeeSite

        stmt = stmt.where(LeaveRequest.employee_id.in_(select(EmployeeSite.employee_id).where(EmployeeSite.site_id == site_id)))  # type: ignore[attr-defined]
    if waiting_on_me:
        waiting = ["recommended", "pending", "cancellation_requested"] if ctx.has(Perm.LEAVE_APPROVE) else ["pending"]
        stmt = stmt.where(LeaveRequest.status.in_(waiting))  # type: ignore[attr-defined]
        if not ctx.has(Perm.LEAVE_APPROVE):
            stmt = stmt.where(LeaveRequest.levels == 2)
    rows = (await ctx.session.exec(stmt.limit(limit))).all()
    return await service.to_read(ctx, list(rows))


@router.get("/leave/requests/{request_id}")
async def request_detail(request_id: UUID, ctx=require(Perm.LEAVE_VIEW)):
    req = await service.LeaveRepository(ctx).get(request_id)
    lt = await service.get_type(ctx, req.leave_type_id)
    b = await service.balance_row(ctx, req.employee_id, lt, req.start_date.year)
    from staffsync.core.adapters import get_storage

    attachments = [{"key": k, "url": await get_storage().presign_get(k, 300)} for k in req.attachment_keys]
    return {"request": (await service.to_read(ctx, [req], with_timeline=True))[0], "attachments": attachments,
            "balance": {"entitled": b.entitled, "adjusted": b.adjusted, "used": b.used, "pending": b.pending, "remaining_after_approval": b.remaining + req.days * (1 if req.status in ('pending', 'recommended') else 0) - (req.days if req.status in ('pending', 'recommended') else 0)}}


@router.get("/leave/requests/{request_id}/coverage")
async def request_coverage(request_id: UUID, ctx=require(Perm.LEAVE_VIEW)):
    return await service.coverage(ctx, await service.LeaveRepository(ctx).get(request_id))


def _decision(path: str, action: str, perm: Perm):
    @router.post(f"/leave/requests/{{request_id}}/{path}", response_model=LeaveRead, name=f"leave_{action}")
    async def _h(request_id: UUID, body: DecisionIn, ctx=require(perm)):
        req = await service.act(ctx, await service.LeaveRepository(ctx).get(request_id), action, body.comment)
        return (await service.to_read(ctx, [req], with_timeline=True))[0]


_decision("approve", "approve", Perm.LEAVE_APPROVE)
_decision("reject", "reject", Perm.LEAVE_APPROVE)
_decision("request-changes", "request_changes", Perm.LEAVE_APPROVE)
_decision("cancel", "cancel_approved", Perm.LEAVE_APPROVE)


@router.post("/leave/requests/{request_id}/recommend", response_model=LeaveRead)
async def recommend(request_id: UUID, body: RecommendIn, ctx=require(Perm.LEAVE_RECOMMEND)):
    req = await service.LeaveRepository(ctx).get(request_id)
    if body.decision == "reject":
        ctx.require(Perm.LEAVE_RECOMMEND)
        req.recommendation, req.recommendation_comment = "reject", body.comment
        from staffsync.modules.leave import rules

        req.status = rules.next_status(req.status, "recommend", levels=req.levels)
        if req.status == "recommended":
            req.current_step = 2
        ctx.session.add(req)
        await service._log(ctx, req, "recommended", f"[reject] {body.comment}")
    else:
        req = await service.act(ctx, req, "recommend", body.comment)
    return (await service.to_read(ctx, [req], with_timeline=True))[0]


@router.post("/leave/requests/bulk")
async def bulk(body: BulkDecisionIn, ctx=require(Perm.LEAVE_APPROVE)):
    done, failed = [], []
    for rid in body.ids:
        try:
            async with ctx.session.begin_nested():
                await service.act(ctx, await service.LeaveRepository(ctx).get(rid), body.action, body.reason)
            done.append(rid)
        except Exception as exc:
            failed.append({"id": rid, "error": getattr(exc, "code", "ERROR")})
    return {"processed": done, "failed": failed}


@router.get("/leave/calendar")
async def calendar(from_: Annotated[date, Query(alias="from")], to: date, site_id: UUID | None = None, ctx=require(Perm.LEAVE_VIEW)):
    stmt = service.LeaveRepository(ctx).query().where(LeaveRequest.start_date <= to, LeaveRequest.end_date >= from_, LeaveRequest.status.in_(["approved", "pending", "recommended"]))  # type: ignore[attr-defined]
    if site_id:
        from staffsync.modules.employees.models import EmployeeSite

        stmt = stmt.where(LeaveRequest.employee_id.in_(select(EmployeeSite.employee_id).where(EmployeeSite.site_id == site_id)))  # type: ignore[attr-defined]
    return await service.to_read(ctx, list((await ctx.session.exec(stmt)).all()))


@router.get("/leave/balances")
async def all_balances(year: int, employee_id: UUID | None = None, ctx=require(Perm.LEAVE_VIEW)):
    from staffsync.modules.employees.service import EmployeeRepository

    stmt = EmployeeRepository(ctx).query().where(Employee.status != "deactivated")
    if employee_id:
        stmt = stmt.where(Employee.id == employee_id)
    emps = (await ctx.session.exec(stmt.limit(500))).all()
    return [{"employee_id": e.id, "balances": await service.balances(ctx, e.id, year)} for e in emps]


@router.post("/leave/balances/{balance_id}/adjust")
async def adjust(balance_id: UUID, body: AdjustIn, ctx=require(Perm.LEAVE_SETTINGS)):
    b = (await ctx.session.exec(select(LeaveBalance).where(LeaveBalance.id == balance_id, LeaveBalance.company_id == ctx.company_id).with_for_update())).first()
    if b is None:
        raise NotFound()
    before = b.adjusted
    b.adjusted += body.delta
    audit(ctx, "leave.balance_adjusted", "leave_balance", b.id, before={"adjusted": before}, after={"adjusted": b.adjusted}, reason=body.reason, employee_id=b.employee_id)
    return {"remaining": b.remaining, "adjusted": b.adjusted}
