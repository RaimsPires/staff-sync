"""Permanent erasure of one person's personal data (right to be forgotten).

Attendance and leave records stay, because the company must keep its working-time history, but nothing in them
points at a name any more. A person who also works for another company on StaffSync keeps their account there:
only what this company holds is erased.
"""

from datetime import UTC, datetime

from sqlalchemy import delete, func, update
from sqlmodel import select

from staffsync.core.adapters import get_storage
from staffsync.core.audit import audit
from staffsync.core.context import RequestContext
from staffsync.core.errors import Forbidden
from staffsync.core.security import verify_password
from staffsync.modules.attendance.models import AttendanceRecord
from staffsync.modules.auth.models import CompanyMember, User
from staffsync.modules.auth.tokens import revoke_user_sessions
from staffsync.modules.chat.models import Message
from staffsync.modules.employees.models import Device, Employee, EmployeeNote

ERASED = "Former employee"


async def erase_employee(ctx: RequestContext, emp: Employee, password: str) -> None:
    """Needs the acting administrator's password again, so a stolen session cannot wipe people."""
    if not verify_password(password, ctx.user.password_hash):
        raise Forbidden("Password is incorrect", code="INVALID_CREDENTIALS")
    s = ctx.session
    user = await s.get(User, emp.user_id)
    files: list[str] = [k for k in (emp.photo_key, user.avatar_key if user else None) if k]
    files += [k for (keys,) in (await s.exec(select(AttendanceRecord.selfie_keys).where(AttendanceRecord.employee_id == emp.id).execution_options(include_deleted=True))).all() for k in (keys or [])]  # type: ignore[attr-defined]
    for msg in (await s.exec(select(Message).where(Message.company_id == ctx.company_id, Message.sender_user_id == emp.user_id))).all():
        files += [a["key"] for a in msg.attachments]
        msg.body, msg.attachments, msg.deleted_at = "", [], datetime.now(UTC)
        s.add(msg)

    await s.exec(update(AttendanceRecord).where(AttendanceRecord.employee_id == emp.id).values(selfie_keys=[], notes=None))  # type: ignore[arg-type]
    await s.exec(delete(EmployeeNote).where(EmployeeNote.employee_id == emp.id))  # type: ignore[arg-type]
    await s.exec(update(Device).where(Device.employee_id == emp.id).values(push_token=None, revoked_at=datetime.now(UTC)))  # type: ignore[arg-type]
    emp.pin_hash, emp.badge_token, emp.photo_key, emp.status = None, None, None, "deactivated"
    if emp.deleted_at is None:
        emp.deleted_at, emp.deleted_by, emp.delete_reason = datetime.now(UTC), ctx.user.id, "Erased on request"
    s.add(emp)

    if user is not None:
        other = (await s.exec(select(func.count()).select_from(CompanyMember).where(CompanyMember.user_id == user.id, CompanyMember.company_id != ctx.company_id, CompanyMember.status == "active"))).one()  # type: ignore[attr-defined]
        if other == 0:  # nobody else relies on this account: wipe the identity itself
            user.full_name, user.email, user.phone, user.password_hash, user.totp_secret = ERASED, None, None, None, None
            user.totp_enabled, user.backup_codes, user.avatar_key, user.status = False, None, None, "disabled"
            s.add(user)
            await revoke_user_sessions(s, user.id)
        else:
            await revoke_user_sessions(s, user.id, company_id=ctx.company_id)
    audit(ctx, "employee.erased", "employee", emp.id)
    storage = get_storage()
    delete_file = getattr(storage, "delete", None)
    if delete_file:
        for key in files:
            await delete_file(key)
