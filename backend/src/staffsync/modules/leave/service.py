from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from sqlalchemy import or_
from sqlmodel import select

from staffsync.common.repository import TenantRepository
from staffsync.core.audit import audit
from staffsync.core.context import RequestContext
from staffsync.core.errors import BusinessRule, NotFound, ValidationFailed
from staffsync.core.messages import N_
from staffsync.core.outbox import emit
from staffsync.modules.alerts.models import Alert
from staffsync.modules.auth.models import User
from staffsync.modules.branches.models import Branch
from staffsync.modules.employees.models import Employee
from staffsync.modules.leave import rules
from staffsync.modules.leave.models import Holiday, LeaveApproval, LeaveBalance, LeaveRequest, LeaveType
from staffsync.modules.leave.schemas import LeaveDraft, LeaveRead, PreviewOut, TimelineEntry, Warning_
from staffsync.modules.notifications.service import push_in_app
from staffsync.modules.schedules.models import LIVE_SHIFT, Shift
from staffsync.modules.settings.service import company_settings
from staffsync.modules.sites.models import Site, SiteManager


class LeaveRepository(TenantRepository[LeaveRequest]):
    """Scope: requests of employees the user can see (their sites/branches), plus their own."""

    model = LeaveRequest

    def scope(self, stmt):
        from staffsync.modules.employees.service import EmployeeRepository

        if self.ctx.scope.site_ids is None:
            return stmt
        visible = EmployeeRepository(self.ctx).scope(select(Employee.id).where(Employee.company_id == self.ctx.company_id))
        return stmt.where(LeaveRequest.employee_id.in_(visible))


async def _holidays(ctx: RequestContext, emp: Employee, start: date, end: date) -> set[date]:
    branch = await ctx.session.get(Branch, emp.branch_id)
    if not branch or not branch.holiday_calendar_id:
        return set()
    return set((await ctx.session.exec(select(Holiday.date).where(Holiday.calendar_id == branch.holiday_calendar_id, Holiday.date >= start, Holiday.date <= end))).all())


async def levels_for(ctx: RequestContext, emp: Employee) -> int:
    branch = await ctx.session.get(Branch, emp.branch_id)
    if branch and branch.leave_levels:
        return branch.leave_levels
    return (await company_settings(ctx.session, ctx.company_id, "leave"))["levels"]


async def get_type(ctx: RequestContext, type_id: UUID) -> LeaveType:
    t = (await ctx.session.exec(select(LeaveType).where(LeaveType.id == type_id, LeaveType.company_id == ctx.company_id))).first()
    if t is None:
        raise NotFound("Leave type not found")
    return t


async def balance_row(ctx: RequestContext, emp_id: UUID, lt: LeaveType, year: int, *, lock: bool = False) -> LeaveBalance:
    stmt = select(LeaveBalance).where(LeaveBalance.employee_id == emp_id, LeaveBalance.leave_type_id == lt.id, LeaveBalance.year == year)
    if lock:
        stmt = stmt.with_for_update()
    b = (await ctx.session.exec(stmt)).first()
    if b is None:
        b = LeaveBalance(company_id=ctx.company_id, employee_id=emp_id, leave_type_id=lt.id, year=year, entitled=lt.yearly_allowance)
        ctx.session.add(b)
        await ctx.session.flush()
    return b


def _year(d: date) -> int:
    return d.year


async def preview(ctx: RequestContext, emp: Employee, draft: LeaveDraft, exclude: UUID | None = None) -> PreviewOut:
    lt = await get_type(ctx, draft.leave_type_id)
    if (draft.start_half or draft.end_half) and not lt.half_day_allowed:
        raise ValidationFailed("Half days are not allowed for this leave type", code="HALF_DAY_NOT_ALLOWED")
    if draft.start_date.year != draft.end_date.year:
        raise ValidationFailed("Split requests that cross a year end", code="CROSSES_YEAR")
    hol = await _holidays(ctx, emp, draft.start_date, draft.end_date)
    days = rules.count_days(draft.start_date, draft.end_date, draft.start_half, draft.end_half, hol, half_days_allowed=lt.half_day_allowed)
    if days <= 0:
        raise ValidationFailed("The selected dates contain no working days", code="NO_WORKING_DAYS")
    b = await balance_row(ctx, emp.id, lt, draft.start_date.year)
    remaining_after = b.entitled + b.adjusted - b.used - b.pending - days
    warnings: list[Warning_] = []
    if remaining_after < 0 and lt.yearly_allowance > 0:
        warnings.append(Warning_(code="EXCEEDS_BALANCE", detail=f"{-remaining_after:g} day(s) over"))
    notice = (draft.start_date - datetime.now(UTC).date()).days
    if notice < lt.min_notice_days:
        warnings.append(Warning_(code="SHORT_NOTICE", detail=f"{lt.min_notice_days} days required"))
    if lt.requires_document and not draft.attachment_keys:
        warnings.append(Warning_(code="DOCUMENT_REQUIRED"))
    other = select(LeaveRequest.id).where(LeaveRequest.employee_id == emp.id, LeaveRequest.status.in_(["pending", "recommended", "approved", "changes_requested"]),  # type: ignore[attr-defined]
                                          LeaveRequest.start_date <= draft.end_date, LeaveRequest.end_date >= draft.start_date)
    if exclude:
        other = other.where(LeaveRequest.id != exclude)
    if (await ctx.session.exec(other)).first():
        warnings.append(Warning_(code="OVERLAPS_LEAVE"))
    lo, hi = datetime.combine(draft.start_date, datetime.min.time(), UTC), datetime.combine(draft.end_date + timedelta(days=1), datetime.min.time(), UTC)
    if (await ctx.session.exec(select(Shift.id).where(Shift.employee_id == emp.id, Shift.is_intervention.is_(True), Shift.status == "scheduled", Shift.starts_at >= lo, Shift.starts_at < hi))).first():  # type: ignore[attr-defined]
        warnings.append(Warning_(code="OVERLAPS_INTERVENTION"))
    return PreviewOut(days=days, remaining_after=remaining_after, warnings=warnings, reviewer=await reviewer_name(ctx, emp))


async def reviewer_name(ctx: RequestContext, emp: Employee) -> str | None:
    levels = await levels_for(ctx, emp)
    if levels == 2:
        row = (await ctx.session.exec(select(User).join(SiteManager, SiteManager.user_id == User.id).join(Site, Site.id == SiteManager.site_id)
                .where(Site.id.in_(select(Site.id).where(Site.company_id == ctx.company_id))).limit(1))).first()
        if row:
            return row.full_name
    return None


async def _log(ctx: RequestContext, req: LeaveRequest, action: str, comment: str | None = None, step: int | None = None) -> None:
    ctx.session.add(LeaveApproval(company_id=ctx.company_id, request_id=req.id, step=step or req.current_step, action=action, actor_user_id=ctx.user.id, actor_name=ctx.user.full_name, comment=comment,
                                  decided_at=datetime.now(UTC)))


async def to_read(ctx: RequestContext, reqs: list[LeaveRequest], *, with_timeline: bool = False) -> list[LeaveRead]:
    if not reqs:
        return []
    emps = {e.id: e for e in (await ctx.session.exec(select(Employee).where(Employee.id.in_({r.employee_id for r in reqs})).execution_options(include_deleted=True))).all()}  # type: ignore[attr-defined]
    users = {u.id: u for u in (await ctx.session.exec(select(User).where(User.id.in_({e.user_id for e in emps.values()})))).all()}  # type: ignore[attr-defined]
    tl: dict[UUID, list[TimelineEntry]] = {r.id: [] for r in reqs}
    if with_timeline:
        for a in (await ctx.session.exec(select(LeaveApproval).where(LeaveApproval.request_id.in_(list(tl))).order_by(LeaveApproval.decided_at))).all():  # type: ignore[attr-defined]
            tl[a.request_id].append(TimelineEntry(actor=a.actor_name, action=a.action, at=a.decided_at, comment=a.comment))
    return [LeaveRead(**r.model_dump(include=set(LeaveRead.model_fields) - {"employee_name", "approver", "timeline"}), employee_name=users[emps[r.employee_id].user_id].full_name if r.employee_id in emps else None,
                      approver=("Site manager, then HR" if r.levels == 2 else "Admin"), timeline=tl[r.id]) for r in reqs]


async def submit(ctx: RequestContext, emp: Employee, draft: LeaveDraft) -> LeaveRequest:
    if draft.start_date < datetime.now(UTC).date():
        raise ValidationFailed("Start date is in the past", code="PAST_DATE")
    pv = await preview(ctx, emp, draft)
    if any(w.code in ("OVERLAPS_LEAVE", "DOCUMENT_REQUIRED") for w in pv.warnings):
        raise BusinessRule("Request cannot be submitted", code=next(w.code for w in pv.warnings if w.code in ("OVERLAPS_LEAVE", "DOCUMENT_REQUIRED")))
    lt = await get_type(ctx, draft.leave_type_id)
    b = await balance_row(ctx, emp.id, lt, draft.start_date.year, lock=True)
    b.pending += pv.days
    ctx.session.add(b)
    req = LeaveRequest(company_id=ctx.company_id, employee_id=emp.id, levels=await levels_for(ctx, emp), days=pv.days, **draft.model_dump())
    ctx.session.add(req)
    await ctx.session.flush()
    await _log(ctx, req, "submitted", draft.reason or None)
    emit(ctx.session, ctx.company_id, "LeaveRequested", {"request_id": str(req.id), "employee_id": str(emp.id), "levels": req.levels})
    return req


async def edit(ctx: RequestContext, emp: Employee, req: LeaveRequest, draft: LeaveDraft) -> LeaveRequest:
    if req.employee_id != emp.id:
        raise NotFound()
    if req.status not in ("pending", "changes_requested"):
        rules.next_status(req.status, "edit")  # raises the standard 409
    if "attachment_keys" not in draft.model_fields_set:
        draft.attachment_keys = list(req.attachment_keys)  # omitted means keep the existing files
    pv = await preview(ctx, emp, draft, exclude=req.id)
    if any(w.code in ("OVERLAPS_LEAVE", "DOCUMENT_REQUIRED") for w in pv.warnings):
        raise BusinessRule("Request cannot be submitted", code=next(w.code for w in pv.warnings if w.code in ("OVERLAPS_LEAVE", "DOCUMENT_REQUIRED")))
    old_type = await get_type(ctx, req.leave_type_id)
    ob = await balance_row(ctx, emp.id, old_type, req.start_date.year, lock=True)
    ob.pending -= req.days
    nb = await balance_row(ctx, emp.id, await get_type(ctx, draft.leave_type_id), draft.start_date.year, lock=True)
    nb.pending += pv.days
    ctx.session.add_all([ob, nb])
    resub = req.status == "changes_requested"
    for k, v in draft.model_dump().items():
        setattr(req, k, v)
    req.days, req.status, req.recommendation, req.recommendation_comment = pv.days, "pending", None, None
    ctx.session.add(req)
    await _log(ctx, req, "resubmitted" if resub else "edited", draft.reason or None)
    return req


async def _release(ctx: RequestContext, req: LeaveRequest, *, used: bool) -> None:
    lt = await get_type(ctx, req.leave_type_id)
    b = await balance_row(ctx, req.employee_id, lt, req.start_date.year, lock=True)
    if used:
        b.used -= req.days
    else:
        b.pending -= req.days
    ctx.session.add(b)


async def _set_shifts(ctx: RequestContext, req: LeaveRequest, on_leave: bool) -> None:
    emp = await ctx.session.get(Employee, req.employee_id)
    lo, hi = datetime.combine(req.start_date - timedelta(days=1), datetime.min.time(), UTC), datetime.combine(req.end_date + timedelta(days=2), datetime.min.time(), UTC)
    shifts = (await ctx.session.exec(select(Shift).where(Shift.employee_id == req.employee_id, Shift.starts_at >= lo, Shift.starts_at < hi, Shift.status.in_(LIVE_SHIFT)))).all()
    from zoneinfo import ZoneInfo

    for sh in shifts:
        site = await ctx.session.get(Site, sh.site_id)
        local = sh.starts_at.astimezone(ZoneInfo(site.timezone)).date() if site else sh.starts_at.date()
        if not (req.start_date <= local <= req.end_date):
            continue
        if on_leave and sh.status == "scheduled":
            sh.status = "on_leave"
            if sh.is_intervention:  # nobody covers the intervention any more
                ctx.session.add(Alert(company_id=ctx.company_id, type="uncovered_intervention", site_id=sh.site_id, employee_id=sh.employee_id, shift_id=sh.id, reasons=["LEAVE_APPROVED"], severity="medium"))
        elif not on_leave and sh.status == "on_leave":
            sh.status = "scheduled"
    del emp


async def act(ctx: RequestContext, req: LeaveRequest, action: str, comment: str | None = None) -> LeaveRequest:
    """One entry point for every manager/admin transition, so the state machine and side effects stay together."""
    from staffsync.common.enums import Perm

    needs = Perm.LEAVE_RECOMMEND if action == "recommend" else Perm.LEAVE_APPROVE
    ctx.require(needs)
    new = rules.next_status(req.status, action, levels=req.levels)
    old = req.status
    if action in ("reject", "request_changes", "cancel_approved") and not comment:
        raise ValidationFailed("A comment is required", code="COMMENT_REQUIRED")
    if action == "approve":
        lt = await get_type(ctx, req.leave_type_id)
        b = await balance_row(ctx, req.employee_id, lt, req.start_date.year, lock=True)
        b.pending -= req.days
        b.used += req.days
        ctx.session.add(b)
        await _set_shifts(ctx, req, True)
    elif action in ("reject", "cancel"):
        await _release(ctx, req, used=False)
    elif action == "request_changes":
        pass  # stays reserved as pending while the employee edits
    elif action == "cancel_approved":
        await _release(ctx, req, used=True)
        await _set_shifts(ctx, req, False)
    elif action == "recommend":
        req.recommendation, req.recommendation_comment = "approve", comment
    req.status = new
    if action == "recommend" and new == "recommended":
        req.current_step = 2
    ctx.session.add(req)
    log_action = {"approve": "approved", "reject": "rejected", "request_changes": "changes_requested", "cancel_approved": "cancelled", "recommend": "recommended", "cancel": "cancelled",
                  "reject_cancellation": "approved"}.get(action, action)
    await _log(ctx, req, log_action, comment)
    audit(ctx, f"leave.{log_action}", "leave_request", req.id, before={"status": old}, after={"status": new}, reason=comment, employee_id=req.employee_id)
    if action in ("approve", "reject", "request_changes", "cancel_approved"):
        emp = await ctx.session.get(Employee, req.employee_id)
        if emp:
            push_in_app(ctx.session, ctx.company_id, emp.user_id, "leave_decision", {"approve": N_("Leave approved"), "reject": N_("Leave rejected"), "request_changes": N_("Changes requested"), "cancel_approved": N_("Leave cancelled")}[action], comment or "", href=f"/leave/{req.id}")
        emit(ctx.session, ctx.company_id, "LeaveApproved" if action == "approve" else "LeaveDecided", {"request_id": str(req.id), "employee_id": str(req.employee_id), "decision": log_action})
    return req


async def employee_cancel(ctx: RequestContext, emp: Employee, req: LeaveRequest, reason: str | None) -> LeaveRequest:
    if req.employee_id != emp.id:
        raise NotFound()
    action = "request_cancellation" if req.status == "approved" else "cancel"
    new = rules.next_status(req.status, action, levels=req.levels)
    if action == "request_cancellation":
        if not reason:
            raise ValidationFailed("A reason is required to cancel approved leave", code="COMMENT_REQUIRED")
    else:
        await _release(ctx, req, used=False)
    req.status = new
    ctx.session.add(req)
    await _log(ctx, req, "cancellation_requested" if action == "request_cancellation" else "cancelled", reason)
    if action == "request_cancellation":
        emit(ctx.session, ctx.company_id, "LeaveCancellationRequested", {"request_id": str(req.id)})
    return req


async def coverage(ctx: RequestContext, req: LeaveRequest) -> dict:
    emp = await ctx.session.get(Employee, req.employee_id)
    assert emp is not None
    site_ids = select(Shift.site_id).where(Shift.employee_id == emp.id, Shift.starts_at >= datetime.combine(req.start_date, datetime.min.time(), UTC),
                                           Shift.starts_at < datetime.combine(req.end_date + timedelta(days=1), datetime.min.time(), UTC), Shift.status.in_(LIVE_SHIFT))
    others = (await ctx.session.exec(select(LeaveRequest, Employee, User).join(Employee, Employee.id == LeaveRequest.employee_id).join(User, User.id == Employee.user_id)
              .where(LeaveRequest.status.in_(["approved", "pending", "recommended"]), LeaveRequest.id != req.id, LeaveRequest.company_id == ctx.company_id, LeaveRequest.start_date <= req.end_date,  # type: ignore[attr-defined]
                     LeaveRequest.end_date >= req.start_date, or_(Employee.branch_id == emp.branch_id,
                     Employee.id.in_(select(Shift.employee_id).where(Shift.site_id.in_(site_ids))))))).all()
    affected = (await ctx.session.exec(select(Shift).where(Shift.employee_id == emp.id, Shift.starts_at >= datetime.combine(req.start_date, datetime.min.time(), UTC),
                                                           Shift.starts_at < datetime.combine(req.end_date + timedelta(days=1), datetime.min.time(), UTC), Shift.status.in_(LIVE_SHIFT)))).all()
    return {"colleagues_off": [{"employee_id": e.id, "name": u.full_name, "start": l.start_date, "end": l.end_date, "status": l.status, "leave_type_id": l.leave_type_id} for l, e, u in others],
            "affected_shifts": [{"id": s.id, "starts_at": s.starts_at, "ends_at": s.ends_at, "intervention": s.is_intervention, "site_id": s.site_id} for s in affected]}


async def balances(ctx: RequestContext, emp_id: UUID, year: int) -> list[dict]:
    types = (await ctx.session.exec(select(LeaveType).where(LeaveType.company_id == ctx.company_id))).all()
    out = []
    for lt in types:
        b = await balance_row(ctx, emp_id, lt, year)
        out.append({"balance_id": b.id, "leave_type_id": lt.id, "year": year, "entitled": b.entitled, "adjusted": b.adjusted, "used": b.used, "pending": b.pending, "remaining": b.remaining})
    return out
