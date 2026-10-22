from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Column, Field, SQLModel

from staffsync.common.models import IdMixin, SoftDeleteMixin, TimestampMixin


class Company(IdMixin, TimestampMixin, SoftDeleteMixin, SQLModel, table=True):
    __tablename__ = "companies"

    name: str
    logo_key: str | None = None
    industry: str | None = None
    size: str | None = None
    country: str = "CM"
    timezone: str = "Africa/Douala"
    locale: str = "en"
    plan: str = "trial"
    status: str = "active"  # active | read_only | pending_deletion
    stripe_customer_id: str | None = Field(default=None, index=True)
    stripe_subscription_id: str | None = None
    subscription_status: str | None = None
    current_period_end: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    trial_ends_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    seat_limit: int = 10
    onboarding_step: int = 1
    onboarding_done: bool = False
    retention_days: int = 90
    deletion_scheduled_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    # Attendance rules, leave policy and notification matrix; defaults live in settings/defaults.py.
    settings: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}"))


class ApiKey(IdMixin, TimestampMixin, SQLModel, table=True):
    __tablename__ = "api_keys"

    company_id: UUID = Field(foreign_key="companies.id", index=True)
    name: str
    prefix: str
    key_hash: str = Field(index=True)
    last_used_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    revoked_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
