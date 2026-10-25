from datetime import UTC, datetime
from uuid import UUID

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from staffsync.modules.notifications.models import Notification


def push_in_app(session: AsyncSession, company_id: UUID, user_id: UUID, type_: str, title: str, body: str = "", href: str | None = None, **payload) -> Notification:
    """Always create the in-app row so the bell and the mobile list stay consistent; channel fan-out happens in the worker."""
    n = Notification(company_id=company_id, user_id=user_id, type=type_, title=title, body=body, href=href, payload=payload)
    session.add(n)
    return n


async def mark_read(session: AsyncSession, user_id: UUID, ids: list[UUID] | None) -> None:
    stmt = select(Notification).where(Notification.user_id == user_id, Notification.read_at.is_(None))  # type: ignore[union-attr]
    if ids:
        stmt = stmt.where(Notification.id.in_(ids))  # type: ignore[attr-defined]
    for n in (await session.exec(stmt)).all():
        n.read_at = datetime.now(UTC)


# notification type -> the preference key (mobile settings) that can switch it off
PUSH_PREF = {"leave_decision": "leaveUpdates", "shift_reminder": "shiftReminders", "schedule_change": "shiftReminders", "arrival_prompt": "arrivalPrompt"}


async def push_tokens(session: AsyncSession, company_id: UUID, user_ids: set[UUID], pref: str | None = None) -> list[str]:
    """Expo push tokens of the active phones of these people, skipping anyone who turned the category off."""
    from staffsync.modules.auth.models import User
    from staffsync.modules.employees.models import Device, Employee

    if not user_ids:
        return []
    rows = (await session.exec(
        select(Device.push_token, User.notification_prefs)
        .join(Employee, Employee.id == Device.employee_id)
        .join(User, User.id == Employee.user_id)
        .where(Employee.company_id == company_id, Employee.user_id.in_(user_ids), Device.revoked_at.is_(None), Device.push_token.is_not(None))  # type: ignore[union-attr,attr-defined]
    )).all()
    return [tok for tok, prefs in rows if tok and not (pref and isinstance(prefs, dict) and prefs.get(pref) is False)]


_background: set = set()


def push_later(tokens: list[str], title: str, body: str, **data) -> None:
    """Send without making the request wait for the push service; failures are logged by the notifier."""
    import asyncio

    from staffsync.core.adapters import notify

    if not tokens:
        return

    async def run() -> None:
        for tok in tokens:
            await notify("push", tok, body, subject=title, **data)

    task = asyncio.get_running_loop().create_task(run())
    _background.add(task)
    task.add_done_callback(_background.discard)
