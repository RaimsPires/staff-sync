from uuid import UUID

from sqlalchemy import Index, text
from sqlmodel import Field, SQLModel

from staffsync.common.models import IdMixin, SoftDeleteMixin, TenantMixin, TimestampMixin


class Branch(IdMixin, TimestampMixin, SoftDeleteMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "branches"
    __table_args__ = (
        Index("uq_branch_code_live", "company_id", "code", unique=True, postgresql_where=text("deleted_at IS NULL")),
    )

    name: str
    code: str
    address: str | None = None
    timezone: str = "Africa/Douala"
    holiday_calendar_id: UUID | None = Field(default=None, foreign_key="holiday_calendars.id")
    leave_levels: int | None = None  # None = use the company policy
    status: str = "active"  # active | archived
