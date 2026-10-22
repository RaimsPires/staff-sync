from datetime import date, datetime
from uuid import UUID

from sqlalchemy import DateTime, Index, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlmodel import Column, Field, SQLModel, String

from staffsync.common.models import IdMixin, SoftDeleteMixin, TenantMixin, TimestampMixin


class LeaveType(IdMixin, TimestampMixin, SoftDeleteMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "leave_types"

    name_en: str
    name_fr: str
    color: str = "#2563eb"
    paid: bool = True
    yearly_allowance: float = 0
    requires_document: bool = False
    min_notice_days: int = 0
    half_day_allowed: bool = True
    carry_over_max: float = 0


class LeaveBalance(IdMixin, TimestampMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "leave_balances"
    __table_args__ = (Index("uq_balance", "employee_id", "leave_type_id", "year", unique=True),)

    employee_id: UUID = Field(foreign_key="employees.id", index=True)
    leave_type_id: UUID = Field(foreign_key="leave_types.id")
    year: int
    entitled: float = 0
    used: float = 0
    pending: float = 0
    adjusted: float = 0

    @property
    def remaining(self) -> float:
        return self.entitled + self.adjusted - self.used - self.pending


class LeaveRequest(IdMixin, TimestampMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "leave_requests"
    __table_args__ = (Index("ix_leave_status", "company_id", "status"),)

    employee_id: UUID = Field(foreign_key="employees.id", index=True)
    leave_type_id: UUID = Field(foreign_key="leave_types.id")
    start_date: date
    end_date: date
    start_half: str | None = None  # morning | afternoon
    end_half: str | None = None
    days: float
    reason: str = ""
    attachment_keys: list[str] = Field(default_factory=list, sa_column=Column(ARRAY(String), nullable=False, server_default="{}"))
    status: str = "pending"
    current_step: int = 1
    levels: int = 1
    recommendation: str | None = None
    recommendation_comment: str | None = None


class LeaveApproval(IdMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "leave_approvals"

    request_id: UUID = Field(foreign_key="leave_requests.id", index=True)
    step: int
    action: str  # submitted | recommended | approved | rejected | changes_requested | cancelled | cancellation_requested
    actor_user_id: UUID | None = None
    actor_name: str | None = None
    comment: str | None = None
    decided_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False, server_default=text("now()")))


class HolidayCalendar(IdMixin, TimestampMixin, SoftDeleteMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "holiday_calendars"

    name: str


class Holiday(IdMixin, SoftDeleteMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "holidays"
    __table_args__ = (Index("uq_holiday", "calendar_id", "date", unique=True, postgresql_where=text("deleted_at IS NULL")),)

    calendar_id: UUID = Field(foreign_key="holiday_calendars.id", index=True)
    date: date
    name: str
