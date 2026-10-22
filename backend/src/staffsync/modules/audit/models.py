from uuid import UUID

from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Column, Field, SQLModel

from staffsync.common.models import IdMixin, TenantMixin, TimestampMixin


class AuditLog(IdMixin, TimestampMixin, TenantMixin, SQLModel, table=True):
    """Append-only: no update or delete path exists in the code base."""

    __tablename__ = "audit_logs"

    actor_user_id: UUID | None = Field(default=None, index=True)
    actor_name: str | None = None
    actor_role: str | None = None
    action: str = Field(index=True)
    target_type: str
    target_id: str | None = None
    employee_id: UUID | None = Field(default=None, index=True)
    scope: str | None = None
    before: dict | None = Field(default=None, sa_column=Column(JSONB))
    after: dict | None = Field(default=None, sa_column=Column(JSONB))
    reason: str | None = None
    ip: str | None = None
    user_agent: str | None = None
