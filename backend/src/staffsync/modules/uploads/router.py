from uuid import uuid4

from fastapi import APIRouter
from pydantic import BaseModel, Field

from staffsync.core.adapters import get_storage
from staffsync.core.deps import require

router = APIRouter(prefix="/uploads", tags=["uploads"])

MAX_IMAGE = 5_000_000
MAX_DOC = 10_000_000


class UploadIn(BaseModel):
    content_type: str = Field(pattern=r"^(image/(jpeg|png|webp)|application/pdf)$")
    size_bytes: int = Field(gt=0, le=MAX_DOC)


async def _presign(prefix: str, body: UploadIn, *, images_only: bool = False):
    if images_only and not body.content_type.startswith("image/"):
        from staffsync.core.errors import ValidationFailed

        raise ValidationFailed("Only images are accepted here")
    ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf"}[body.content_type]
    return await get_storage().presign_put(f"{prefix}/{uuid4().hex}.{ext}", body.content_type, MAX_IMAGE if body.content_type.startswith("image/") else MAX_DOC)


@router.post("/selfie")
async def selfie(body: UploadIn, ctx=require(employee=True)):
    return await _presign(f"selfies/{ctx.company_id}/{ctx.user.id}", body, images_only=True)


@router.post("/leave-attachment")
async def leave_attachment(body: UploadIn, ctx=require(employee=True)):
    return await _presign(f"leave/{ctx.company_id}/{ctx.user.id}", body)


@router.post("/correction-attachment")
async def correction_attachment(body: UploadIn, ctx=require(employee=True)):
    return await _presign(f"corrections/{ctx.company_id}/{ctx.user.id}", body)


@router.post("/proxy-photo")
async def proxy_photo(body: UploadIn, ctx=require(employee=True)):
    return await _presign(f"selfies/{ctx.company_id}/{ctx.user.id}", body, images_only=True)
