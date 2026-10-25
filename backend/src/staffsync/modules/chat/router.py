import json
import secrets
from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query

from staffsync.core.deps import require
from staffsync.core.redis import get_redis
from staffsync.modules.chat import service
from staffsync.modules.chat.schemas import ConversationOut, DirectIn, MessageIn, MessageOut, PersonOut, TicketOut

router = APIRouter(prefix="/chat", tags=["chat"])
TICKET_TTL = 30


@router.get("/people", response_model=list[PersonOut])
async def people(q: Annotated[str | None, Query(max_length=100)] = None, ctx=require()):
    return await service.people(ctx, q)


@router.get("/conversations", response_model=list[ConversationOut])
async def conversations(ctx=require()):
    return await service.list_conversations(ctx)


@router.post("/conversations/direct", response_model=ConversationOut)
async def open_direct(body: DirectIn, ctx=require()):
    return await service.describe(ctx, await service.direct_conversation(ctx, body.user_id))


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
async def messages(conversation_id: UUID, before: datetime | None = None, limit: Annotated[int, Query(ge=1, le=100)] = 40, ctx=require()):
    return await service.messages(ctx, await service.get_conversation(ctx, conversation_id), before, limit)


@router.post("/conversations/{conversation_id}/messages", response_model=MessageOut, status_code=201)
async def send(conversation_id: UUID, body: MessageIn, ctx=require()):
    return await service.send(ctx, await service.get_conversation(ctx, conversation_id), body)


@router.post("/conversations/{conversation_id}/read", status_code=204)
async def read(conversation_id: UUID, ctx=require()):
    await service.mark_read(ctx, await service.get_conversation(ctx, conversation_id))


@router.post("/ticket", response_model=TicketOut)
async def ticket(ctx=require()):
    """Single-use ticket for `/ws?ticket=...` that subscribes the socket to this user's chat channels."""
    t = secrets.token_urlsafe(24)
    payload = {"company_id": str(ctx.company_id), "sites": [], "extra": await service.ticket_channels(ctx)}
    await get_redis().set(f"ws:ticket:{t}", json.dumps(payload), ex=TICKET_TTL)
    return TicketOut(ticket=t, expires_in=TICKET_TTL)
