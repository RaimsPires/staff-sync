"""Upload and download endpoints for the development (local disk) storage. The URL token is the credential:
it is signed by the server, names one key and one operation, and expires, like an S3 presigned URL."""

import mimetypes

from fastapi import APIRouter, Request, Response
from fastapi.responses import Response as RawResponse

from staffsync.core.adapters import LocalStorage, get_storage, read_capability
from staffsync.core.errors import NotFound, ValidationFailed

router = APIRouter(prefix="/files", tags=["files"])


def _local() -> LocalStorage:
    storage = get_storage()
    if not isinstance(storage, LocalStorage):
        raise NotFound()  # with S3 configured, files never pass through this API
    return storage


@router.put("/{token}", status_code=204)
async def upload(token: str, request: Request) -> Response:
    cap = read_capability(token)
    if cap.get("op") != "put":
        raise NotFound()
    storage = _local()
    if request.headers.get("content-type", "").split(";")[0].strip() != cap["ct"]:
        raise ValidationFailed("Wrong file type for this upload")
    limit = int(cap["max"])
    data = bytearray()
    async for chunk in request.stream():
        data.extend(chunk)
        if len(data) > limit:
            raise ValidationFailed("File too large")
    if not data:
        raise ValidationFailed("Empty file")
    await storage.put(cap["key"], bytes(data), cap["ct"])
    return Response(status_code=204)


@router.get("/{token}")
async def download(token: str) -> RawResponse:
    cap = read_capability(token)
    if cap.get("op") != "get":
        raise NotFound()
    data = await _local().get(cap["key"])
    if data is None:
        raise NotFound()
    ctype = mimetypes.guess_type(cap["key"])[0] or "application/octet-stream"
    return RawResponse(data, media_type=ctype, headers={"Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff"})
