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


CHAT_LIMITS = {"image/jpeg": 8_000_000, "image/png": 8_000_000, "image/webp": 8_000_000, "image/heic": 8_000_000, "video/mp4": 50_000_000, "video/quicktime": 50_000_000,
               "audio/mpeg": 15_000_000, "audio/mp4": 15_000_000, "audio/aac": 15_000_000, "application/pdf": 15_000_000}
CHAT_EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "video/mp4": "mp4", "video/quicktime": "mov", "audio/mpeg": "mp3", "audio/mp4": "m4a",
            "audio/aac": "aac", "application/pdf": "pdf"}


class ChatUploadIn(BaseModel):
    content_type: str
    size_bytes: int = Field(gt=0)


@router.post("/chat-attachment")
async def chat_attachment(body: ChatUploadIn, ctx=require()):
    """Photos, short videos, voice notes and PDFs for the in-app chat. The key starts with the company, which the chat checks."""
    from staffsync.core.errors import ValidationFailed

    limit = CHAT_LIMITS.get(body.content_type)
    if limit is None:
        raise ValidationFailed("This file type is not supported in chat")
    if body.size_bytes > limit:
        raise ValidationFailed("File too large")
    return await get_storage().presign_put(f"chat/{ctx.company_id}/{ctx.user.id}/{uuid4().hex}.{CHAT_EXT[body.content_type]}", body.content_type, limit)


@router.post("/avatar")
async def avatar(body: UploadIn, ctx=require()):
    """A profile photo. Attach it with PATCH /me {"avatar_key": key}."""
    return await _presign(f"avatars/{ctx.user.id}", body, images_only=True)
