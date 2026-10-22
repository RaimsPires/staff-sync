from uuid import UUID

from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Column, Field, SQLModel

from staffsync.common.models import IdMixin, TenantMixin, TimestampMixin


class SavedReport(IdMixin, TimestampMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "saved_reports"

    owner_user_id: UUID
    name: str
    definition: dict = Field(default_factory=dict, sa_column=Column(JSONB, nullable=False))
    schedule: dict | None = Field(default=None, sa_column=Column(JSONB))
