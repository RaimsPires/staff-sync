from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends

from staffsync.common.enums import Perm
from staffsync.common.schemas import Deletion, ReasonIn, deleted_flags
from staffsync.core.deps import require
from staffsync.modules.branches import service
from staffsync.modules.branches.schemas import BranchCreate, BranchRead, BranchUpdate

router = APIRouter(prefix="/branches", tags=["branches"])


@router.get("", response_model=list[BranchRead])
async def list_branches(flags: Annotated[Deletion, Depends(deleted_flags)], ctx=require(Perm.BRANCHES_VIEW)):
    repo = service.BranchRepository(ctx)
    if (flags.include_deleted or flags.only_deleted) and not ctx.has(Perm.BRANCHES_MANAGE):
        flags = Deletion()
    rows = (await ctx.session.exec(repo.query(include_deleted=flags.include_deleted, only_deleted=flags.only_deleted).order_by(service.Branch.name))).all()
    return await service.to_read(ctx, list(rows))


@router.post("", response_model=BranchRead, status_code=201)
async def create_branch(body: BranchCreate, ctx=require(Perm.BRANCHES_MANAGE)):
    return (await service.to_read(ctx, [await service.create(ctx, body)]))[0]


@router.get("/{branch_id}", response_model=BranchRead)
async def get_branch(branch_id: UUID, ctx=require(Perm.BRANCHES_VIEW)):
    return (await service.to_read(ctx, [await service.BranchRepository(ctx).get(branch_id)]))[0]


@router.patch("/{branch_id}", response_model=BranchRead)
async def patch_branch(branch_id: UUID, body: BranchUpdate, ctx=require(Perm.BRANCHES_MANAGE)):
    branch = await service.BranchRepository(ctx).get(branch_id)
    return (await service.to_read(ctx, [await service.update(ctx, branch, body)]))[0]


@router.post("/{branch_id}/archive", response_model=BranchRead)
async def archive_branch(branch_id: UUID, ctx=require(Perm.BRANCHES_MANAGE)):
    branch = await service.BranchRepository(ctx).get(branch_id)
    return (await service.to_read(ctx, [await service.archive(ctx, branch)]))[0]


@router.delete("/{branch_id}", status_code=204)
async def delete_branch(branch_id: UUID, body: ReasonIn, ctx=require(Perm.BRANCHES_MANAGE)):
    await service.delete(ctx, await service.BranchRepository(ctx).get(branch_id), body.reason)


@router.post("/{branch_id}/restore", response_model=BranchRead)
async def restore_branch(branch_id: UUID, ctx=require(Perm.BRANCHES_MANAGE)):
    branch = await service.BranchRepository(ctx).get(branch_id, include_deleted=True)
    return (await service.to_read(ctx, [await service.restore_branch(ctx, branch)]))[0]
