from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Index
from sqlalchemy.dialects.postgresql import ARRAY
from sqlmodel import Column, Field, SQLModel, String

from staffsync.common.models import IdMixin, TenantMixin, TimestampMixin


class Alert(IdMixin, TimestampMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "alerts"
    __table_args__ = (Index("ix_alerts_status", "company_id", "status", "created_at"),)

    type: str
    record_id: UUID | None = Field(default=None, foreign_key="attendance_records.id", index=True)
    site_id: UUID | None = Field(default=None, foreign_key="sites.id", index=True)
    employee_id: UUID | None = Field(default=None, foreign_key="employees.id", index=True)
    shift_id: UUID | None = Field(default=None, foreign_key="shifts.id")
    reasons: list[str] = Field(default_factory=list, sa_column=Column(ARRAY(String), nullable=False, server_default="{}"))
    severity: str = "medium"
    status: str = "open"
    assigned_to: UUID | None = None
    resolved_by: UUID | None = None
    resolved_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    resolution_note: str | None = None


class AlertNote(IdMixin, TimestampMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "alert_notes"

    alert_id: UUID = Field(foreign_key="alerts.id", index=True)
    author_user_id: UUID
    body: str
