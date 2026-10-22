from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel, Field

from staffsync.common.enums import Perm
from staffsync.core.deps import require
from staffsync.modules.settings import service

router = APIRouter(prefix="/settings", tags=["settings"])


def _section(path: str, name: str, perm: Perm):
    @router.get(f"/{path}", name=f"get_{name}")
    async def _get(ctx=require(perm)):
        return await service.company_settings(ctx.session, ctx.company_id, name)

    @router.patch(f"/{path}", name=f"patch_{name}")
    async def _patch(body: dict, ctx=require(perm)):
        return await service.update_section(ctx, name, body)


_section("attendance", "attendance", Perm.SETTINGS_MANAGE)
_section("leave-policy", "leave", Perm.LEAVE_SETTINGS)
_section("notifications", "notifications", Perm.SETTINGS_MANAGE)


class ApiKeyIn(BaseModel):
    name: str = Field(min_length=2, max_length=60)


@router.get("/api-keys")
async def api_keys(ctx=require(Perm.SETTINGS_MANAGE)):
    return await service.list_api_keys(ctx)


@router.post("/api-keys", status_code=201)
async def create_key(body: ApiKeyIn, ctx=require(Perm.SETTINGS_MANAGE)):
    return await service.create_api_key(ctx, body.name)


@router.delete("/api-keys/{key_id}", status_code=204)
async def revoke_key(key_id: UUID, ctx=require(Perm.SETTINGS_MANAGE)):
    await service.revoke_api_key(ctx, key_id)
