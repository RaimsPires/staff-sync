from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Column, Field, SQLModel

from staffsync.common.models import IdMixin, TenantMixin, TimestampMixin


class Notification(IdMixin, TimestampMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "notifications"
    __table_args__ = (Index("ix_notif_user", "user_id", "created_at"),)

    user_id: UUID = Field(foreign_key="users.id")
    type: str
    title: str
    body: str = ""
    href: str | None = None
    payload: dict = Field(default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}"))
    read_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    pushed_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))  # when the phone was notified
