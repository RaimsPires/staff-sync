"""Live board push: single-use ticket -> WebSocket subscribed to Redis channels for the sites in the user's scope."""

import asyncio
import json
import secrets

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from staffsync.common.enums import Perm
from staffsync.core.deps import require
from staffsync.core.redis import get_redis

router = APIRouter(tags=["realtime"])


def channel(company_id, site_id) -> str:
    return f"company:{company_id}:site:{site_id}"


@router.post("/ws/ticket")
async def ticket(ctx=require(Perm.ATTENDANCE_VIEW)):
    t = secrets.token_urlsafe(24)
    sites = None if ctx.scope.site_ids is None else [str(s) for s in ctx.scope.site_ids]
    await get_redis().set(f"ws:ticket:{t}", json.dumps({"company_id": str(ctx.company_id), "sites": sites}), ex=30)
    return {"ticket": t, "expires_in": 30}


@router.websocket("/ws")
async def ws(websocket: WebSocket, ticket: str):
    r = get_redis()
    raw = await r.getdel(f"ws:ticket:{ticket}")  # single use
    if not raw:
        await websocket.close(code=4401)
        return
    info = json.loads(raw)
    await websocket.accept()
    pubsub = r.pubsub()
    if info["sites"] is None:
        await pubsub.psubscribe(f"company:{info['company_id']}:site:*")
    elif info["sites"]:
        await pubsub.subscribe(*[channel(info["company_id"], s) for s in info["sites"]])
    else:
        await websocket.close(code=4403)
        return
    if info["sites"] is None:
        await pubsub.subscribe(f"company:{info['company_id']}:all")

    async def pump():
        async for msg in pubsub.listen():
            if msg["type"] in ("message", "pmessage"):
                await websocket.send_text(msg["data"])

    task = asyncio.create_task(pump())
    try:
        while True:
            await websocket.receive_text()  # keep-alive pings from the client
    except WebSocketDisconnect:
        pass
    finally:
        task.cancel()
        await pubsub.aclose()
