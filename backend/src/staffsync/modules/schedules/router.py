from datetime import date, datetime, timedelta
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query
from sqlmodel import select

from staffsync.common.enums import Perm
from staffsync.core.deps import require
from staffsync.core.errors import ValidationFailed
from staffsync.modules.auth.models import User
from staffsync.modules.employees.models import Employee
from staffsync.modules.schedules import mobile, service
from staffsync.modules.schedules.models import Shift
from staffsync.modules.schedules.schemas import (
    AssignmentRead,
    CopyWeekIn,
    DeleteScheduleIn,
    PublishIn,
    ScheduleCreate,
    ScheduleRead,
    ScheduleUpdate,
    ShiftMove,
    ShiftRead,
    ValidateOut,
)
from staffsync.modules.sites.models import Site

router = APIRouter(tags=["schedules"])


@router.get("/schedules", response_model=list[ScheduleRead])
async def list_schedules(site_id: UUID | None = None, type: str | None = None, status: str | None = None, only_deleted: bool = False, ctx=require(Perm.SCHEDULES_VIEW)):
    stmt = service.ScheduleRepository(ctx).query(only_deleted=only_deleted and ctx.has(Perm.SCHEDULES_MANAGE)).order_by(service.Schedule.valid_from.desc())
    if site_id:
        stmt = stmt.where(service.Schedule.site_id == site_id)
    if type:
        stmt = stmt.where(service.Schedule.type == type)
    if status:
        stmt = stmt.where(service.Schedule.status == status)
    return await service.to_read(ctx, list((await ctx.session.exec(stmt)).all()))


@router.post("/schedules", response_model=ScheduleRead, status_code=201)
async def create_schedule(body: ScheduleCreate, ctx=require(Perm.SCHEDULES_MANAGE)):
    return (await service.to_read(ctx, [await service.create(ctx, body)]))[0]


@router.post("/schedules/validate", response_model=ValidateOut)
async def validate(body: ScheduleCreate, ctx=require(Perm.SCHEDULES_MANAGE)):
    rule = service.Rule(body.type, tuple(body.days_of_week), body.start_time, body.end_time, body.crosses_midnight, body.valid_from, body.valid_to, body.rotation)
    conflicts, n = await service.detect_conflicts(ctx, rule, body.site_id, body.employee_ids)
    return ValidateOut(conflicts=conflicts, occurrences=n)


@router.post("/schedules/publish")
async def publish(body: PublishIn, ctx=require(Perm.SCHEDULES_MANAGE)):
    return await service.publish(ctx, body.schedule_ids, body.notify, body.confirm_conflicts)


@router.post("/schedules/copy-week")
async def copy_week(body: CopyWeekIn, ctx=require(Perm.SCHEDULES_MANAGE)):
    return {"copied": await service.copy_week(ctx, body.from_week, body.to_week, body.site_id, body.employee_ids)}


@router.get("/schedules/{schedule_id}", response_model=ScheduleRead)
async def get_schedule(schedule_id: UUID, ctx=require(Perm.SCHEDULES_VIEW)):
    return (await service.to_read(ctx, [await service.ScheduleRepository(ctx).get(schedule_id)]))[0]


@router.patch("/schedules/{schedule_id}", response_model=ScheduleRead)
async def patch_schedule(schedule_id: UUID, body: ScheduleUpdate, ctx=require(Perm.SCHEDULES_MANAGE)):
    s = await service.update(ctx, await service.ScheduleRepository(ctx).get(schedule_id), body)
    return (await service.to_read(ctx, [s]))[0]


@router.delete("/schedules/{schedule_id}", status_code=204)
async def delete_schedule(schedule_id: UUID, body: DeleteScheduleIn, ctx=require(Perm.SCHEDULES_MANAGE)):
    await service.end_or_delete(ctx, await service.ScheduleRepository(ctx).get(schedule_id), body.reason, body.end_from)


@router.post("/schedules/{schedule_id}/restore", response_model=ScheduleRead)
async def restore_schedule(schedule_id: UUID, ctx=require(Perm.SCHEDULES_MANAGE)):
    s = await service.ScheduleRepository(ctx).get(schedule_id, include_deleted=True)
    return (await service.to_read(ctx, [await service.restore_schedule(ctx, s)]))[0]


@router.get("/shifts", response_model=list[ShiftRead])
async def planner(
    from_: Annotated[datetime, Query(alias="from")],
    to: datetime,
    site_id: UUID | None = None,
    employee_id: UUID | None = None,
    ctx=require(Perm.SCHEDULES_VIEW),
):
    if to - from_ > timedelta(days=100):
        raise ValidationFailed("Range too large")
    stmt = service.ShiftRepository(ctx).query().where(Shift.starts_at >= from_, Shift.starts_at < to).order_by(Shift.starts_at)
    if site_id:
        stmt = stmt.where(Shift.site_id == site_id)
    if employee_id:
        stmt = stmt.where(Shift.employee_id == employee_id)
    rows = (await ctx.session.exec(stmt.limit(5000))).all()
    names = {}
    if rows:
        names = dict((await ctx.session.exec(select(Employee.id, User.full_name).join(User, User.id == Employee.user_id).where(Employee.id.in_({r.employee_id for r in rows})))).all())  # type: ignore[attr-defined]
        snames = dict((await ctx.session.exec(select(Site.id, Site.name).where(Site.id.in_({r.site_id for r in rows})).execution_options(include_deleted=True))).all())  # type: ignore[attr-defined]
    else:
        snames = {}
    return [ShiftRead(id=r.id, employee_id=r.employee_id, employee_name=names.get(r.employee_id), site_id=r.site_id, site_name=snames.get(r.site_id), schedule_id=r.schedule_id,
                      is_intervention=r.is_intervention, starts_at=r.starts_at, ends_at=r.ends_at, status=r.status, exception=r.exception) for r in rows]


@router.patch("/shifts/{shift_id}", response_model=ShiftRead)
async def move_shift(shift_id: UUID, body: ShiftMove, ctx=require(Perm.SCHEDULES_MANAGE)):
    sh = await service.move_shift(ctx, await service.ShiftRepository(ctx).get(shift_id), body.starts_at, body.ends_at, body.notify)
    return ShiftRead(id=sh.id, employee_id=sh.employee_id, site_id=sh.site_id, schedule_id=sh.schedule_id, is_intervention=sh.is_intervention, starts_at=sh.starts_at, ends_at=sh.ends_at, status=sh.status, exception=sh.exception)


@router.get("/me/shifts", response_model=list[AssignmentRead])
async def my_shifts(from_: Annotated[date, Query(alias="from")], to: date, ctx=require(employee=True)):
    if (to - from_).days > 100:
        raise ValidationFailed("Range too large")
    return await mobile.my_range(ctx, from_, to)


@router.get("/me/shifts/today", response_model=list[AssignmentRead])
async def my_today(ctx=require(employee=True)):
    return await mobile.my_today(ctx)


@router.get("/me/shifts/{shift_id}", response_model=AssignmentRead)
async def my_shift(shift_id: UUID, ctx=require(employee=True)):
    return await mobile.my_shift(ctx, shift_id)


@router.get("/me/holidays")
async def my_holidays(from_: Annotated[date, Query(alias="from")], to: date, ctx=require(employee=True)):
    return await mobile.my_holidays(ctx, from_, to)
