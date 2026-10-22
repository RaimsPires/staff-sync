"""Soft delete / restore used by every module that supports a trash."""

from datetime import UTC, datetime

from staffsync.core.audit import audit
from staffsync.core.context import RequestContext
from staffsync.core.errors import Conflict, ValidationFailed
from staffsync.core.outbox import emit


def soft_delete(ctx: RequestContext, obj, reason: str, *, entity: str) -> None:
    if not reason or len(reason.strip()) < 3:
        raise ValidationFailed("A reason is required")
    if obj.deleted_at is not None:
        raise Conflict("Already deleted")
    obj.deleted_at = datetime.now(UTC)
    obj.deleted_by = ctx.user.id
    obj.delete_reason = reason.strip()
    ctx.session.add(obj)
    audit(ctx, f"{entity}.deleted", entity, obj.id, reason=reason)
    emit(ctx.session, ctx.company_id, f"{entity.capitalize()}Deleted", {"id": str(obj.id)})


def restore(ctx: RequestContext, obj, *, entity: str) -> None:
    if obj.deleted_at is None:
        raise Conflict("Not deleted")
    obj.deleted_at = None
    obj.deleted_by = None
    obj.delete_reason = None
    ctx.session.add(obj)
    audit(ctx, f"{entity}.restored", entity, obj.id)
    emit(ctx.session, ctx.company_id, f"{entity.capitalize()}Restored", {"id": str(obj.id)})
