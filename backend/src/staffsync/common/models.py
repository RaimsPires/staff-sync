"""Shared SQLModel base classes. Table models inherit the mixins they need."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, text
from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(UTC)


class IdMixin(SQLModel):
    id: UUID = Field(default_factory=uuid4, primary_key=True)


class TimestampMixin(SQLModel):
    created_at: datetime = Field(
        default_factory=utcnow, sa_type=DateTime(timezone=True), sa_column_kwargs={"server_default": text("now()")}
    )
    updated_at: datetime = Field(
        default_factory=utcnow,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": text("now()"), "onupdate": utcnow},
    )


class TenantMixin(SQLModel):
    company_id: UUID = Field(foreign_key="companies.id", index=True)


class SoftDeleteMixin(SQLModel):
    deleted_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    deleted_by: UUID | None = Field(default=None)
    delete_reason: str | None = Field(default=None)


class VersionMixin(SQLModel):
    """Optimistic locking: updates send If-Match with the version they read."""

    version: int = Field(default=1)
