"""Audit helper: services call `audit(ctx, ...)` inside their transaction."""

from typing import Any
from uuid import UUID

from staffsync.core.context import RequestContext
from staffsync.modules.audit.models import AuditLog


def _plain(value: Any) -> Any:
    if value is None:
        return None
    if hasattr(value, "model_dump"):
        value = value.model_dump(mode="json")
    return value


def audit(
    ctx: RequestContext,
    action: str,
    target_type: str,
    target_id: UUID | str | None = None,
    *,
    before: Any = None,
    after: Any = None,
    reason: str | None = None,
    employee_id: UUID | None = None,
) -> None:
    ctx.session.add(
        AuditLog(
            company_id=ctx.company_id,
            actor_user_id=ctx.user.id,
            actor_name=ctx.user.full_name,
            actor_role=", ".join(ctx.role_names) or None,
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id else None,
            employee_id=employee_id,
            before=_plain(before),
            after=_plain(after),
            reason=reason,
            ip=ctx.ip,
            user_agent=ctx.user_agent,
        )
    )
