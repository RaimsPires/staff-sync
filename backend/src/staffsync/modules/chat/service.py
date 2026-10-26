"""In-app chat. Two kinds of conversation:

* direct: any two active people of the same company;
* site: one group per site. Everyone attached to the site (employees assigned to it, its managers) is in it, and a
  user holding `chat.sites` can also read and write in every site group inside their scope without being attached,
  which is how an administrator passes information to a site.

Messages are pushed live over the WebSocket (Redis channels per user and per site) and kept in Postgres.
"""

import json
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, or_
from sqlmodel import select

from staffsync.common.enums import Perm
from staffsync.core.adapters import get_storage
from staffsync.core.context import RequestContext
from staffsync.core.errors import NotFound, ValidationFailed
from staffsync.core.redis import get_redis
from staffsync.modules.auth.models import CompanyMember, User
from staffsync.modules.chat.models import Conversation, Message, ReadMark
from staffsync.modules.chat.schemas import AttachmentOut, ConversationOut, MessageIn, MessageOut, PersonOut
from staffsync.modules.employees.models import Employee, EmployeeSite
from staffsync.modules.notifications.service import push_later, push_tokens
from staffsync.modules.sites.models import Site, SiteManager

PREVIEW = 120


def user_channel(company_id: UUID, user_id: UUID) -> str:
    return f"company:{company_id}:chat:user:{user_id}"


def site_channel(company_id: UUID, site_id: UUID) -> str:
    return f"company:{company_id}:chat:site:{site_id}"


# --- who may use which conversation -------------------------------------------------------------------------


async def attached_site_ids(ctx: RequestContext) -> set[UUID]:
    """Sites the user belongs to: assigned as an employee, or managing them."""
    ids: set[UUID] = set()
    if ctx.employee_id:
        ids |= set((await ctx.session.exec(select(EmployeeSite.site_id).where(EmployeeSite.employee_id == ctx.employee_id))).all())
    ids |= set((await ctx.session.exec(select(SiteManager.site_id).where(SiteManager.user_id == ctx.user.id, SiteManager.company_id == ctx.company_id))).all())
    return ids


async def chat_sites(ctx: RequestContext) -> dict[UUID, Site]:
    """Every active site whose group the user can read and write in, by id."""
    allowed = await attached_site_ids(ctx)
    stmt = select(Site).where(Site.company_id == ctx.company_id, Site.status == "active", Site.deleted_at.is_(None))  # type: ignore[union-attr]
    if not ctx.has(Perm.CHAT_SITES):
        stmt = stmt.where(Site.id.in_(allowed)) if allowed else stmt.where(Site.id.is_(None))
    else:
        # The permission reaches every site in the user's scope, and always the ones they are attached to.
        if ctx.scope.site_ids is not None:
            stmt = stmt.where(Site.id.in_(set(ctx.scope.site_ids) | allowed)) if (ctx.scope.site_ids or allowed) else stmt.where(Site.id.is_(None))
    return {s.id: s for s in (await ctx.session.exec(stmt)).all()}


async def _person_map(ctx: RequestContext, user_ids: set[UUID]) -> dict[UUID, PersonOut]:
    if not user_ids:
        return {}
    users = (await ctx.session.exec(select(User).where(User.id.in_(user_ids)))).all()  # type: ignore[attr-defined]
    titles = {e.user_id: e.job_title for e in (await ctx.session.exec(select(Employee).where(Employee.company_id == ctx.company_id, Employee.user_id.in_(user_ids)))).all()}  # type: ignore[attr-defined]
    storage = get_storage()
    out: dict[UUID, PersonOut] = {}
    for u in users:
        out[u.id] = PersonOut(id=u.id, name=u.full_name, title=titles.get(u.id), avatar_url=await storage.presign_get(u.avatar_key, 3600) if u.avatar_key else None)
    return out


async def people(ctx: RequestContext, q: str | None) -> list[PersonOut]:
    """Active people of the company the user can start a direct conversation with."""
    stmt = select(User).join(CompanyMember, CompanyMember.user_id == User.id).where(
        CompanyMember.company_id == ctx.company_id, CompanyMember.status == "active", User.id != ctx.user.id, User.status == "active"
    )
    if q:
        stmt = stmt.where(func.lower(User.full_name).like(f"%{q.lower()}%"))
    users = (await ctx.session.exec(stmt.order_by(User.full_name).limit(100))).all()
    pm = await _person_map(ctx, {u.id for u in users})
    return [pm[u.id] for u in users]


# --- conversations ------------------------------------------------------------------------------------------


async def _get_or_create(ctx: RequestContext, **keys) -> Conversation:
    stmt = select(Conversation).where(Conversation.company_id == ctx.company_id, *[getattr(Conversation, k) == v for k, v in keys.items()])
    conv = (await ctx.session.exec(stmt)).first()
    if conv is None:
        conv = Conversation(company_id=ctx.company_id, **keys)
        ctx.session.add(conv)
        await ctx.session.flush()
    return conv


async def direct_conversation(ctx: RequestContext, other_id: UUID) -> Conversation:
    if other_id == ctx.user.id:
        raise ValidationFailed("You cannot message yourself")
    member = (await ctx.session.exec(select(CompanyMember).where(CompanyMember.company_id == ctx.company_id, CompanyMember.user_id == other_id, CompanyMember.status == "active"))).first()
    if member is None:
        raise NotFound()  # someone outside the company looks like nobody
    a, b = sorted((ctx.user.id, other_id), key=str)
    return await _get_or_create(ctx, kind="direct", user_a=a, user_b=b)


async def get_conversation(ctx: RequestContext, conversation_id: UUID) -> Conversation:
    """A conversation the user belongs to; anything else is a 404 so ids do not leak across people."""
    conv = (await ctx.session.exec(select(Conversation).where(Conversation.id == conversation_id, Conversation.company_id == ctx.company_id))).first()
    if conv is None:
        raise NotFound()
    if conv.kind == "direct":
        if ctx.user.id not in (conv.user_a, conv.user_b):
            raise NotFound()
    elif conv.site_id not in await chat_sites(ctx):
        raise NotFound()
    return conv


async def _unread(ctx: RequestContext, conv: Conversation) -> int:
    """Messages from other people after the user last read the conversation (everything, if they never opened it)."""
    mark = (await ctx.session.exec(select(ReadMark).where(ReadMark.conversation_id == conv.id, ReadMark.user_id == ctx.user.id))).first()
    stmt = select(func.count()).select_from(Message).where(Message.conversation_id == conv.id, Message.sender_user_id != ctx.user.id, Message.deleted_at.is_(None))  # type: ignore[union-attr]
    if mark:
        stmt = stmt.where(Message.created_at > mark.last_read_at)
    return int((await ctx.session.exec(stmt)).one())


async def list_conversations(ctx: RequestContext) -> list[ConversationOut]:
    sites = await chat_sites(ctx)
    convs: list[Conversation] = [await _get_or_create(ctx, kind="site", site_id=sid) for sid in sites]
    convs += list((await ctx.session.exec(select(Conversation).where(Conversation.company_id == ctx.company_id, Conversation.kind == "direct", or_(Conversation.user_a == ctx.user.id, Conversation.user_b == ctx.user.id)))).all())
    others = {(c.user_b if c.user_a == ctx.user.id else c.user_a) for c in convs if c.kind == "direct"}
    pm = await _person_map(ctx, {o for o in others if o})
    counts = dict((await ctx.session.exec(select(EmployeeSite.site_id, func.count()).where(EmployeeSite.site_id.in_(list(sites))).group_by(EmployeeSite.site_id))).all()) if sites else {}  # type: ignore[attr-defined]
    out: list[ConversationOut] = []
    for c in convs:
        other_id = (c.user_b if c.user_a == ctx.user.id else c.user_a) if c.kind == "direct" else None
        if c.kind == "direct" and c.last_message_at is None:
            continue  # an empty direct conversation (opened but never used) stays out of the list
        site = sites.get(c.site_id) if c.site_id else None
        out.append(ConversationOut(
            id=c.id, kind=c.kind, title=(site.name if site else (pm[other_id].name if other_id in pm else "")), site_id=c.site_id, other=pm.get(other_id) if other_id else None,  # type: ignore[arg-type]
            last_message_at=c.last_message_at, last_message_preview=c.last_message_preview, unread=await _unread(ctx, c), members=counts.get(c.site_id) if c.site_id else None,
        ))
    out.sort(key=lambda o: (o.last_message_at is None, -(o.last_message_at.timestamp() if o.last_message_at else 0), o.title.lower()))
    return out


async def describe(ctx: RequestContext, conv: Conversation) -> ConversationOut:
    for c in await list_conversations(ctx):
        if c.id == conv.id:
            return c
    # a direct conversation with no message yet is not in the list; describe it on its own
    other_id = conv.user_b if conv.user_a == ctx.user.id else conv.user_a
    pm = await _person_map(ctx, {other_id} if other_id else set())
    return ConversationOut(id=conv.id, kind=conv.kind, title=pm[other_id].name if other_id in pm else "", other=pm.get(other_id) if other_id else None)  # type: ignore[arg-type]


# --- messages -----------------------------------------------------------------------------------------------


async def _message_out(ctx: RequestContext, m: Message, people_: dict[UUID, PersonOut]) -> MessageOut:
    storage = get_storage()
    atts = [AttachmentOut(**a, url=await storage.presign_get(a["key"], 3600)) for a in m.attachments]
    sender = people_.get(m.sender_user_id) or PersonOut(id=m.sender_user_id, name="")
    return MessageOut(id=m.id, conversation_id=m.conversation_id, sender=sender, body=m.body, attachments=atts, created_at=m.created_at)


async def messages(ctx: RequestContext, conv: Conversation, before: datetime | None, limit: int) -> list[MessageOut]:
    stmt = select(Message).where(Message.conversation_id == conv.id, Message.deleted_at.is_(None))  # type: ignore[union-attr]
    if before:
        stmt = stmt.where(Message.created_at < before)
    rows = list((await ctx.session.exec(stmt.order_by(Message.created_at.desc()).limit(limit))).all())  # type: ignore[attr-defined]
    pm = await _person_map(ctx, {m.sender_user_id for m in rows})
    return [await _message_out(ctx, m, pm) for m in reversed(rows)]  # oldest first


def _preview(body: str, attachments: list[dict]) -> str:
    if body.strip():
        return body.strip().replace("\n", " ")[:PREVIEW]
    first = attachments[0]["content_type"] if attachments else ""
    return "📷" if first.startswith("image/") else "🎬" if first.startswith("video/") else "🎤" if first.startswith("audio/") else "📎"


async def send(ctx: RequestContext, conv: Conversation, body: MessageIn) -> MessageOut:
    text = body.body.strip()
    if not text and not body.attachments:
        raise ValidationFailed("Write a message or attach a file")
    prefix = f"chat/{ctx.company_id}/"
    for a in body.attachments:
        if not a.key.startswith(prefix):
            raise ValidationFailed("Unknown attachment")  # only files uploaded through the chat upload endpoint of this company
    attachments = [a.model_dump() for a in body.attachments]
    msg = Message(company_id=ctx.company_id, conversation_id=conv.id, sender_user_id=ctx.user.id, body=text, attachments=attachments)
    ctx.session.add(msg)
    conv.last_message_at = datetime.now(UTC)
    conv.last_message_preview = _preview(text, attachments)
    ctx.session.add(conv)
    await ctx.session.flush()
    # the sender has obviously read up to here
    mark = (await ctx.session.exec(select(ReadMark).where(ReadMark.conversation_id == conv.id, ReadMark.user_id == ctx.user.id))).first()
    if mark:
        mark.last_read_at = conv.last_message_at
        ctx.session.add(mark)
    else:
        ctx.session.add(ReadMark(company_id=ctx.company_id, conversation_id=conv.id, user_id=ctx.user.id, last_read_at=conv.last_message_at))
    out = await _message_out(ctx, msg, await _person_map(ctx, {ctx.user.id}))
    await publish(ctx.company_id, conv, out)
    await _push_to_others(ctx, conv, out)
    return out


async def _recipients(ctx: RequestContext, conv: Conversation) -> set[UUID]:
    if conv.kind == "direct":
        return {u for u in (conv.user_a, conv.user_b) if u and u != ctx.user.id}
    ids = set((await ctx.session.exec(select(Employee.user_id).join(EmployeeSite, EmployeeSite.employee_id == Employee.id).where(EmployeeSite.site_id == conv.site_id))).all())
    ids |= set((await ctx.session.exec(select(SiteManager.user_id).where(SiteManager.site_id == conv.site_id))).all())
    ids.discard(ctx.user.id)
    return ids


async def _push_to_others(ctx: RequestContext, conv: Conversation, msg: MessageOut) -> None:
    tokens = await push_tokens(ctx.session, ctx.company_id, await _recipients(ctx, conv), pref="chat")
    title = msg.sender.name if conv.kind == "direct" else f"{msg.sender.name} · {await _site_name(ctx, conv)}"
    push_later(tokens, title, msg.body or conv.last_message_preview or "", type="chat", conversation_id=str(conv.id))


async def _site_name(ctx: RequestContext, conv: Conversation) -> str:
    site = await ctx.session.get(Site, conv.site_id) if conv.site_id else None
    return site.name if site else ""


async def publish(company_id: UUID, conv: Conversation, message: MessageOut) -> None:
    """Live delivery: direct conversations go to both people, site groups to everyone listening on the site."""
    payload = json.dumps({"type": "chat.message", "conversation_id": str(conv.id), "kind": conv.kind, "site_id": str(conv.site_id) if conv.site_id else None, "message": json.loads(message.model_dump_json())})
    r = get_redis()
    if conv.kind == "direct":
        for uid in (conv.user_a, conv.user_b):
            await r.publish(user_channel(company_id, uid), payload)  # type: ignore[arg-type]
    elif conv.site_id:
        await r.publish(site_channel(company_id, conv.site_id), payload)


async def mark_read(ctx: RequestContext, conv: Conversation) -> None:
    now = datetime.now(UTC)
    mark = (await ctx.session.exec(select(ReadMark).where(ReadMark.conversation_id == conv.id, ReadMark.user_id == ctx.user.id))).first()
    if mark:
        mark.last_read_at = now
        ctx.session.add(mark)
    else:
        ctx.session.add(ReadMark(company_id=ctx.company_id, conversation_id=conv.id, user_id=ctx.user.id, last_read_at=now))


async def ticket_channels(ctx: RequestContext) -> list[str]:
    """Redis channels a chat WebSocket for this user listens on."""
    return [user_channel(ctx.company_id, ctx.user.id)] + [site_channel(ctx.company_id, sid) for sid in await chat_sites(ctx)]

