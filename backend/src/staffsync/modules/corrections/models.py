from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime
from sqlmodel import Column, Field, SQLModel

from staffsync.common.models import IdMixin, TenantMixin, TimestampMixin


class CorrectionRequest(IdMixin, TimestampMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "correction_requests"

    record_id: UUID = Field(foreign_key="attendance_records.id", index=True)
    employee_id: UUID = Field(foreign_key="employees.id", index=True)
    kind: str
    proposed_in: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    proposed_out: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    comment: str
    attachment_key: str | None = None
    status: str = "pending"
    decided_by: UUID | None = None
    decided_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    admin_response: str | None = None
