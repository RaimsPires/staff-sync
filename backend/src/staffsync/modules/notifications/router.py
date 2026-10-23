from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel
from sqlmodel import select

from staffsync.core.deps import Ctx
from staffsync.core.errors import NotFound
from staffsync.core.i18n import flag_reasons, gettext_
from staffsync.modules.notifications import service
from staffsync.modules.notifications.models import Notification

router = APIRouter(prefix="/me/notifications", tags=["notifications"])


class ReadIn(BaseModel):
    ids: list[UUID] | None = None  # None = all


def _body(n: Notification) -> str:
    if n.type == "fraud_flag":  # stored as reason codes
        return flag_reasons([r for r in n.body.split(", ") if r])
    return gettext_(n.body) if n.body else ""


def _out(n: Notification) -> dict:
    # title/body are stored as English source text; fixed ones translate, user-written notes pass through unchanged
    return {"id": n.id, "type": n.type, "title": gettext_(n.title), "body": _body(n), "href": n.href, "created_at": n.created_at, "read": n.read_at is not None}


@router.get("")
async def list_notifications(ctx: Ctx, unread: bool = False, limit: int = 100):
    stmt = select(Notification).where(Notification.user_id == ctx.user.id, Notification.company_id == ctx.company_id).order_by(Notification.created_at.desc()).limit(min(limit, 200))  # type: ignore[attr-defined]
    if unread:
        stmt = stmt.where(Notification.read_at.is_(None))  # type: ignore[union-attr]
    return [_out(n) for n in (await ctx.session.exec(stmt)).all()]


@router.post("/read", status_code=204)
async def mark_read(body: ReadIn, ctx: Ctx):
    await service.mark_read(ctx.session, ctx.user.id, body.ids)


@router.delete("/{notification_id}", status_code=204)
async def delete(notification_id: UUID, ctx: Ctx):
    n = (await ctx.session.exec(select(Notification).where(Notification.id == notification_id, Notification.user_id == ctx.user.id))).first()
    if n is None:
        raise NotFound()
    await ctx.session.delete(n)
