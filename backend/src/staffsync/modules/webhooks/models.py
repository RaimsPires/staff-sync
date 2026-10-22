from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime
from sqlalchemy.dialects.postgresql import ARRAY
from sqlmodel import Column, Field, SQLModel, String

from staffsync.common.models import IdMixin, TenantMixin, TimestampMixin


class Webhook(IdMixin, TimestampMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "webhooks"

    url: str
    events: list[str] = Field(default_factory=list, sa_column=Column(ARRAY(String), nullable=False, server_default="{}"))
    secret: str
    active: bool = True


class WebhookDelivery(IdMixin, TimestampMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "webhook_deliveries"

    webhook_id: UUID = Field(foreign_key="webhooks.id", index=True)
    event_type: str
    payload: str
    status: str = "pending"  # pending | delivered | failed
    attempts: int = 0
    response_code: int | None = None
    next_attempt_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
