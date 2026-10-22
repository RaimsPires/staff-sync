from fastapi import APIRouter, Response
from sqlalchemy import text

from staffsync.core.db import engine
from staffsync.core.redis import get_redis

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live")
async def live():
    return {"status": "ok"}


@router.get("/ready")
async def ready(response: Response):
    ok = {"db": False, "redis": False}
    try:
        async with engine.connect() as c:
            await c.execute(text("SELECT 1"))
        ok["db"] = True
    except Exception:
        pass
    try:
        ok["redis"] = bool(await get_redis().ping())
    except Exception:
        pass
    if not all(ok.values()):
        response.status_code = 503
    return {"status": "ok" if all(ok.values()) else "degraded"}
