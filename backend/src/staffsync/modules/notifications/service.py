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
