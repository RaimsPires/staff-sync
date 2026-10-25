from fastapi import APIRouter

from staffsync.common.enums import Perm
from staffsync.core.deps import Ctx, require
from staffsync.modules.companies import service
from staffsync.modules.companies.schemas import CompanyRead, CompanyUpdate, DeleteCompanyIn, UploadRequest

router = APIRouter(prefix="/company", tags=["company"])


@router.get("", response_model=CompanyRead)
async def get_company(ctx: Ctx):
    return await service.read_company(ctx, await service.get_company(ctx))


@router.patch("", response_model=CompanyRead)
async def patch_company(body: CompanyUpdate, ctx=require(Perm.SETTINGS_MANAGE)):
    return await service.read_company(ctx, await service.update_company(ctx, body))


@router.post("/logo")
async def upload_logo(body: UploadRequest, ctx=require(Perm.SETTINGS_MANAGE)):
    return await service.logo_upload(ctx, body.content_type, body.size_bytes)


@router.get("/onboarding")
async def onboarding(ctx: Ctx):
    return await service.onboarding(ctx)


@router.post("/export")
async def export_company(ctx=require(Perm.SETTINGS_MANAGE)):
    """A ZIP of the company's data as CSV files, returned as a link valid for one hour (also e-mailed to the requester)."""
    from staffsync.modules.companies import export

    return await export.export_company(ctx)


@router.post("/delete", status_code=202)
async def delete_company(body: DeleteCompanyIn, ctx=require(Perm.SETTINGS_MANAGE)):
    when = await service.schedule_deletion(ctx, body.confirm_name)
    return {"status": "scheduled", "deletion_at": when}
