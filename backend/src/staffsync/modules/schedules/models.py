from datetime import date, datetime, time
from uuid import UUID

from sqlalchemy import DateTime, Index, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlmodel import Column, Field, Integer, SQLModel

from staffsync.common.models import IdMixin, SoftDeleteMixin, TenantMixin, TimestampMixin

# Shift statuses that count as real: draft shifts belong to an unpublished schedule and are only visible in the planner.
LIVE_SHIFT = ("scheduled", "on_leave")


class Schedule(IdMixin, TimestampMixin, SoftDeleteMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "schedules"

    type: str  # recurring | intervention
    site_id: UUID = Field(foreign_key="sites.id", index=True)
    title: str
    days_of_week: list[int] = Field(default_factory=list, sa_column=Column(ARRAY(Integer), nullable=False, server_default="{}"))  # 0=Mon
    start_time: time
    end_time: time
    crosses_midnight: bool = False
    break_min: int = 0
    grace_min: int = 10
    early_leave_tol_min: int = 10
    valid_from: date
    valid_to: date | None = None
    rotation: dict | None = Field(default=None, sa_column=Column(JSONB))
    instructions: str | None = None
    priority: str | None = None
    attachments: list[dict] = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))
    status: str = "draft"  # draft | published


class ScheduleAssignment(IdMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "schedule_assignments"
    __table_args__ = (Index("uq_schedule_employee", "schedule_id", "employee_id", unique=True),)

    schedule_id: UUID = Field(foreign_key="schedules.id", index=True)
    employee_id: UUID = Field(foreign_key="employees.id", index=True)


class Shift(IdMixin, TimestampMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "shifts"
    __table_args__ = (
        Index("ix_shifts_employee_start", "employee_id", "starts_at"),
        Index("ix_shifts_site_start", "company_id", "site_id", "starts_at", postgresql_where=text("status <> 'cancelled'")),
        Index("uq_shift_occurrence", "schedule_id", "employee_id", "starts_at", unique=True),
    )

    employee_id: UUID = Field(foreign_key="employees.id")
    site_id: UUID = Field(foreign_key="sites.id")
    schedule_id: UUID = Field(foreign_key="schedules.id")
    starts_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    ends_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    grace_min: int = 10
    early_leave_tol_min: int = 10
    break_min: int = 0
    is_intervention: bool = False
    status: str = "scheduled"  # draft | scheduled | on_leave | cancelled
    exception: bool = False  # moved/resized individually
    updated_by_admin: bool = False
    previous_starts_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
