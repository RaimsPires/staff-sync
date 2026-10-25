from typing import Annotated
from uuid import UUID

import segno
from fastapi import APIRouter, Depends, File, Header, Query, Response, UploadFile
from pydantic import BaseModel, Field
from sqlmodel import select

from staffsync.common.enums import Perm
from staffsync.common.schemas import Deletion, ReasonIn, deleted_flags
from staffsync.core.audit import audit
from staffsync.core.deps import require
from staffsync.core.errors import Conflict, ValidationFailed
from staffsync.modules.auth.models import User
from staffsync.modules.employees import importer, service
from staffsync.modules.employees.models import Employee, EmployeeNote
from staffsync.modules.employees.schemas import (
    BadgeOut,
    DeviceRead,
    DeviceRegisterIn,
    EmployeeCreate,
    EmployeeCreated,
    EmployeeRead,
    EmployeeUpdate,
    NoteIn,
    NoteRead,
    PushTokenIn,
)

router = APIRouter(tags=["employees"])


def _version(v: str | None) -> int | None:
    try:
        return int(v.strip('"')) if v else None
    except ValueError as exc:
        raise ValidationFailed("Invalid If-Match header") from exc


@router.get("/employees", response_model=list[EmployeeRead])
async def list_employees(
    flags: Annotated[Deletion, Depends(deleted_flags)],
    branch_id: UUID | None = None,
    site_id: UUID | None = None,
    status: str | None = None,
    has_smartphone: bool | None = None,
    q: str | None = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
    ctx=require(Perm.EMPLOYEES_VIEW),
):
    if (flags.include_deleted or flags.only_deleted) and not ctx.has(Perm.EMPLOYEES_MANAGE):
        flags = Deletion()
    from sqlalchemy import or_

    from staffsync.modules.employees.models import EmployeeSite

    stmt = service.EmployeeRepository(ctx).query(include_deleted=flags.include_deleted, only_deleted=flags.only_deleted)
    if branch_id:
        stmt = stmt.where(Employee.branch_id == branch_id)
    if site_id:
        stmt = stmt.where(Employee.id.in_(select(EmployeeSite.employee_id).where(EmployeeSite.site_id == site_id)))
    if status:
        stmt = stmt.where(Employee.status.in_(status.split(",")))
    if has_smartphone is not None:
        stmt = stmt.where(Employee.has_smartphone == has_smartphone)
    if q:
        like = f"%{q.lower()}%"
        from sqlalchemy import func

        stmt = stmt.where(or_(func.lower(Employee.employee_no).like(like), Employee.user_id.in_(select(User.id).where(or_(func.lower(User.full_name).like(like), User.phone.like(f"%{q}%"), func.lower(User.email).like(like))))))
    rows = (await ctx.session.exec(stmt.order_by(Employee.employee_no).limit(limit).offset(offset))).all()
    return await service.to_read(ctx, list(rows))


@router.post("/employees", response_model=EmployeeCreated, status_code=201)
async def create_employee(body: EmployeeCreate, ctx=require(Perm.EMPLOYEES_MANAGE)):
    emp, pin = await service.create(ctx, body)
    base = (await service.to_read(ctx, [emp]))[0]
    return EmployeeCreated(**base.model_dump(), badge_pin=pin, badge_token=emp.badge_token if pin else None)


@router.get("/employees/import/template")
async def import_template(ctx=require(Perm.EMPLOYEES_MANAGE)):
    return Response(importer.TEMPLATE, media_type="text/csv", headers={"Content-Disposition": 'attachment; filename="employees-template.csv"'})


@router.post("/employees/import", status_code=201)
async def import_upload(file: Annotated[UploadFile, File()], ctx=require(Perm.EMPLOYEES_MANAGE)):
    content = await file.read(5_000_001)
    if len(content) > 5_000_000:
        raise ValidationFailed("File too large (5 MB max)")
    return await importer.start(ctx, content)


@router.get("/employees/import/{job_id}")
async def import_preview(job_id: UUID, ctx=require(Perm.EMPLOYEES_MANAGE)):
    return await importer.preview(ctx, job_id)


@router.put("/employees/import/{job_id}/mapping")
async def import_mapping(job_id: UUID, mapping: dict[str, str | None], ctx=require(Perm.EMPLOYEES_MANAGE)):
    return await importer.preview(ctx, job_id, mapping)


@router.post("/employees/import/{job_id}/commit")
async def import_commit(job_id: UUID, ctx=require(Perm.EMPLOYEES_MANAGE)):
    return await importer.commit(ctx, job_id)


@router.get("/employees/{employee_id}", response_model=EmployeeRead)
async def get_employee(employee_id: UUID, response: Response, ctx=require(Perm.EMPLOYEES_VIEW)):
    emp = await service.EmployeeRepository(ctx).get(employee_id)
    response.headers["ETag"] = f'"{emp.version}"'
    return (await service.to_read(ctx, [emp]))[0]


@router.patch("/employees/{employee_id}", response_model=EmployeeRead)
async def patch_employee(employee_id: UUID, body: EmployeeUpdate, response: Response, if_match: Annotated[str | None, Header()] = None, ctx=require(Perm.EMPLOYEES_MANAGE)):
    emp = await service.EmployeeRepository(ctx).get(employee_id)
    emp = await service.update(ctx, emp, body, _version(if_match))
    response.headers["ETag"] = f'"{emp.version}"'
    return (await service.to_read(ctx, [emp]))[0]


@router.post("/employees/{employee_id}/deactivate", response_model=EmployeeRead)
async def deactivate(employee_id: UUID, ctx=require(Perm.EMPLOYEES_MANAGE)):
    emp = await service.deactivate(ctx, await service.EmployeeRepository(ctx).get(employee_id))
    return (await service.to_read(ctx, [emp]))[0]


@router.post("/employees/{employee_id}/reactivate", response_model=EmployeeRead)
async def reactivate(employee_id: UUID, ctx=require(Perm.EMPLOYEES_MANAGE)):
    emp = await service.reactivate(ctx, await service.EmployeeRepository(ctx).get(employee_id))
    return (await service.to_read(ctx, [emp]))[0]


@router.delete("/employees/{employee_id}", status_code=204)
async def delete_employee(employee_id: UUID, body: ReasonIn, ctx=require(Perm.EMPLOYEES_MANAGE)):
    await service.delete(ctx, await service.EmployeeRepository(ctx).get(employee_id), body.reason)


@router.post("/employees/{employee_id}/restore", response_model=EmployeeRead)
async def restore_employee(employee_id: UUID, ctx=require(Perm.EMPLOYEES_MANAGE)):
    emp = await service.EmployeeRepository(ctx).get(employee_id, include_deleted=True)
    return (await service.to_read(ctx, [await service.restore_employee(ctx, emp)]))[0]


@router.post("/employees/{employee_id}/invite", status_code=202)
async def invite(employee_id: UUID, ctx=require(Perm.EMPLOYEES_MANAGE)):
    emp = await service.EmployeeRepository(ctx).get(employee_id)
    if not emp.has_smartphone:
        raise Conflict("This employee has no smartphone", code="NO_SMARTPHONE")
    await service.send_invite(ctx, emp)
    return {"status": "sent"}


@router.post("/employees/{employee_id}/badge", response_model=BadgeOut)
async def badge(employee_id: UUID, ctx=require(Perm.EMPLOYEES_MANAGE)):
    emp = await service.EmployeeRepository(ctx).get(employee_id)
    token, pin = await service.make_badge(ctx, emp)
    return BadgeOut(badge_token=token, pin=pin, qr_svg=segno.make(token, error="m").svg_inline(scale=6, border=2))


@router.get("/employees/{employee_id}/notes", response_model=list[NoteRead])
async def list_notes(employee_id: UUID, ctx=require(Perm.EMPLOYEES_VIEW)):
    emp = await service.EmployeeRepository(ctx).get(employee_id)
    rows = (await ctx.session.exec(select(EmployeeNote, User).join(User, User.id == EmployeeNote.author_user_id).where(EmployeeNote.employee_id == emp.id).order_by(EmployeeNote.created_at.desc()))).all()  # type: ignore[attr-defined]
    return [NoteRead(id=n.id, author=u.full_name, body=n.body, created_at=n.created_at) for n, u in rows]


@router.post("/employees/{employee_id}/notes", response_model=NoteRead, status_code=201)
async def add_note(employee_id: UUID, body: NoteIn, ctx=require(Perm.EMPLOYEES_VIEW)):
    """Site managers can leave a note on employees in their scope (mobile 'add note')."""
    emp = await service.EmployeeRepository(ctx).get(employee_id)
    note = EmployeeNote(company_id=ctx.company_id, employee_id=emp.id, author_user_id=ctx.user.id, body=body.body)
    ctx.session.add(note)
    await ctx.session.flush()
    audit(ctx, "employee.note_added", "employee", emp.id, employee_id=emp.id)
    return NoteRead(id=note.id, author=ctx.user.full_name, body=note.body, created_at=note.created_at)


# --- devices ------------------------------------------------------------------------------------------


@router.post("/devices/register", response_model=DeviceRead, status_code=201)
async def register_device(body: DeviceRegisterIn, ctx=require(employee=True)):
    d = await service.register_device(ctx, body)
    return DeviceRead(registered=True, this_device=True, model=d.model, platform=d.platform, app_version=d.app_version, registered_at=d.registered_at, last_active_at=d.last_active_at)


@router.get("/devices/me", response_model=DeviceRead)
async def my_device(ctx=require(employee=True)):
    d = await service.active_device(ctx, ctx.require_employee())
    if d is None:
        return DeviceRead(registered=False)
    return DeviceRead(registered=True, this_device=bool(ctx.device_hash and ctx.device_hash == d.device_id_hash), model=d.model, platform=d.platform,
                      app_version=d.app_version, registered_at=d.registered_at, last_active_at=d.last_active_at)


@router.put("/devices/me/push-token", status_code=204)
async def push_token(body: PushTokenIn, ctx=require(employee=True)):
    d = await service.active_device(ctx, ctx.require_employee())
    if d is None or d.device_id_hash != ctx.device_hash:
        raise Conflict("This phone is not the registered device", code="DEVICE_MISMATCH")
    d.push_token = body.push_token


@router.get("/employees/{employee_id}/device", response_model=DeviceRead)
async def employee_device(employee_id: UUID, ctx=require(Perm.EMPLOYEES_VIEW)):
    emp = await service.EmployeeRepository(ctx).get(employee_id)
    d = await service.active_device(ctx, emp.id)
    if d is None:
        return DeviceRead(registered=False)
    return DeviceRead(registered=True, model=d.model, platform=d.platform, app_version=d.app_version, registered_at=d.registered_at, last_active_at=d.last_active_at)


@router.post("/employees/{employee_id}/device/reset", status_code=204)
async def reset_device(employee_id: UUID, ctx=require(Perm.DEVICES_RESET)):
    await service.reset_device(ctx, await service.EmployeeRepository(ctx).get(employee_id))


class EraseIn(BaseModel):
    password: str = Field(min_length=1, max_length=128)


@router.post("/employees/{employee_id}/erase", status_code=204)
async def erase_employee(employee_id: UUID, body: EraseIn, ctx=require(Perm.EMPLOYEES_MANAGE, Perm.ROLES_MANAGE)):
    """Permanently remove a person's personal data. Owner-level, and asks for the administrator's password again."""
    from staffsync.modules.employees import erasure

    emp = await service.EmployeeRepository(ctx).get(employee_id, include_deleted=True)
    await erasure.erase_employee(ctx, emp, body.password)
