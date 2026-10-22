from uuid import UUID

from fastapi import APIRouter

from staffsync.common.enums import Perm
from staffsync.common.schemas import ReasonIn
from staffsync.core.deps import require
from staffsync.modules.users_roles import service
from staffsync.modules.users_roles.schemas import InviteIn, PreviewIn, RoleCreate, RoleRead, RoleUpdate, UserRead, UserRolesIn

router = APIRouter(tags=["users & roles"])


@router.get("/users", response_model=list[UserRead])
async def list_users(ctx=require(Perm.USERS_MANAGE)):
    return await service.list_users(ctx)


@router.post("/users/invite", status_code=201)
async def invite(body: InviteIn, ctx=require(Perm.USERS_MANAGE)):
    return await service.invite_user(ctx, body)


@router.patch("/users/{user_id}/roles", status_code=204)
async def change_roles(user_id: UUID, body: UserRolesIn, ctx=require(Perm.USERS_MANAGE)):
    await service.change_roles(ctx, user_id, body.role_id, body)


@router.post("/users/{user_id}/revoke", status_code=204)
async def revoke(user_id: UUID, ctx=require(Perm.USERS_MANAGE)):
    await service.revoke_user(ctx, user_id)


@router.get("/roles", response_model=list[RoleRead])
async def list_roles(only_deleted: bool = False, ctx=require(Perm.ROLES_MANAGE)):
    return await service.list_roles(ctx, only_deleted)


@router.post("/roles", response_model=RoleRead, status_code=201)
async def create_role(body: RoleCreate, ctx=require(Perm.ROLES_MANAGE)):
    return await service.create_role(ctx, body)


@router.patch("/roles/{role_id}", response_model=RoleRead)
async def update_role(role_id: UUID, body: RoleUpdate, ctx=require(Perm.ROLES_MANAGE)):
    return await service.update_role(ctx, await service.get_role(ctx, role_id), body)


@router.delete("/roles/{role_id}", status_code=204)
async def delete_role(role_id: UUID, body: ReasonIn, ctx=require(Perm.ROLES_MANAGE)):
    await service.delete_role(ctx, await service.get_role(ctx, role_id), body.reason)


@router.post("/roles/{role_id}/restore", response_model=RoleRead)
async def restore_role(role_id: UUID, ctx=require(Perm.ROLES_MANAGE)):
    from staffsync.common.softdelete import restore

    role = await service.get_role(ctx, role_id, include_deleted=True)
    restore(ctx, role, entity="role")
    await ctx.session.flush()
    return (await service._role_read(ctx, [role]))[0]


@router.get("/permissions")
async def permissions(ctx=require(Perm.ROLES_MANAGE)):
    return service.catalogue()


@router.post("/roles/preview")
async def preview(body: PreviewIn, ctx=require(Perm.ROLES_MANAGE)):
    return await service.preview(ctx, body)
