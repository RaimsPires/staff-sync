from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query
from sqlalchemy import func, or_
from sqlmodel import select

from staffsync.common.enums import Perm
from staffsync.core.deps import Ctx, require
from staffsync.modules.auth.models import User
from staffsync.modules.branches.models import Branch
from staffsync.modules.branches.service import BranchRepository
from staffsync.modules.dashboard import service
from staffsync.modules.employees.models import Employee
from staffsync.modules.employees.service import EmployeeRepository
from staffsync.modules.sites.models import Site
from staffsync.modules.sites.service import SiteRepository

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/overview")
async def overview(days: Annotated[int, Query(ge=1, le=90)] = 7, site_id: UUID | None = None, branch_id: UUID | None = None, ctx=require(Perm.ATTENDANCE_VIEW)):
    return await service.overview(ctx, days, site_id, branch_id)


@router.get("/dashboard/activity")
async def activity(ctx=require(Perm.ATTENDANCE_VIEW)):
    return await service.activity(ctx)


@router.get("/org/tree")
async def org_tree(ctx: Ctx):
    """Scope switcher: company > branches > sites the user can access."""
    branches = (await ctx.session.exec(BranchRepository(ctx).query().where(Branch.status == "active").order_by(Branch.name))).all()
    sites = (await ctx.session.exec(SiteRepository(ctx).query().order_by(Site.name))).all()
    by_branch: dict = {}
    for s in sites:
        by_branch.setdefault(s.branch_id, []).append({"id": s.id, "name": s.name, "status": s.status})
    return {"branches": [{"id": b.id, "name": b.name, "sites": by_branch.get(b.id, [])} for b in branches if b.id in by_branch or ctx.scope.branch_ids is None or b.id in ctx.scope.branch_ids]}


@router.get("/search")
async def search(q: Annotated[str, Query(min_length=2, max_length=60)], ctx: Ctx):
    like = f"%{q.lower()}%"
    out: dict = {"employees": [], "sites": [], "branches": []}
    if ctx.has(Perm.EMPLOYEES_VIEW):
        stmt = EmployeeRepository(ctx).query().join(User, User.id == Employee.user_id).where(or_(func.lower(User.full_name).like(like), func.lower(Employee.employee_no).like(like))).limit(8)
        out["employees"] = [{"id": e.id, "employee_no": e.employee_no} for e in (await ctx.session.exec(stmt)).all()]
        names = dict((await ctx.session.exec(select(Employee.id, User.full_name).join(User, User.id == Employee.user_id).where(Employee.id.in_([e["id"] for e in out["employees"]] or [None])))).all())  # type: ignore[attr-defined]
        for e in out["employees"]:
            e["name"] = names.get(e["id"])
    if ctx.has(Perm.SITES_VIEW):
        out["sites"] = [{"id": s.id, "name": s.name, "code": s.code} for s in (await ctx.session.exec(SiteRepository(ctx).query().where(or_(func.lower(Site.name).like(like), func.lower(Site.code).like(like))).limit(8))).all()]
    if ctx.has(Perm.BRANCHES_VIEW):
        out["branches"] = [{"id": b.id, "name": b.name, "code": b.code} for b in (await ctx.session.exec(BranchRepository(ctx).query().where(or_(func.lower(Branch.name).like(like), func.lower(Branch.code).like(like))).limit(8))).all()]
    return out


@router.get("/trash")
async def trash(type: str | None = None, ctx=require(Perm.SETTINGS_MANAGE)):
    """Soft-deleted items in scope, newest first."""
    from staffsync.modules.attendance.service import AttendanceRepository
    from staffsync.modules.leave.models import LeaveType
    from staffsync.modules.schedules.service import ScheduleRepository
    from staffsync.modules.users_roles.models import Role

    kinds = {
        "employee": (EmployeeRepository(ctx).query(only_deleted=True), lambda r: r.employee_no),
        "site": (SiteRepository(ctx).query(only_deleted=True), lambda r: r.name),
        "branch": (BranchRepository(ctx).query(only_deleted=True), lambda r: r.name),
        "schedule": (ScheduleRepository(ctx).query(only_deleted=True), lambda r: r.title),
        "attendance": (AttendanceRepository(ctx).query(only_deleted=True), lambda r: str(r.occurred_at.date())),
        "role": (select(Role).where(Role.company_id == ctx.company_id, Role.deleted_at.is_not(None)).execution_options(include_deleted=True), lambda r: r.name),  # type: ignore[attr-defined]
        "leave_type": (select(LeaveType).where(LeaveType.company_id == ctx.company_id, LeaveType.deleted_at.is_not(None)).execution_options(include_deleted=True), lambda r: r.name_en),  # type: ignore[attr-defined]
    }
    items = []
    for kind, (stmt, label) in kinds.items():
        if type and type != kind:
            continue
        for r in (await ctx.session.exec(stmt.order_by(type_deleted(stmt)).limit(100))).all():
            items.append({"type": kind, "id": r.id, "label": label(r), "deleted_at": r.deleted_at, "deleted_by": r.deleted_by, "reason": r.delete_reason})
    items.sort(key=lambda i: i["deleted_at"], reverse=True)
    return items


def type_deleted(stmt):
    return stmt.column_descriptions[0]["entity"].deleted_at.desc()
