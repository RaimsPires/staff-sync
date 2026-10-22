from datetime import date, datetime
from uuid import UUID

from sqlalchemy import DateTime, Index, text
from sqlmodel import Column, Field, SQLModel

from staffsync.common.models import IdMixin, SoftDeleteMixin, TenantMixin, TimestampMixin, VersionMixin


class Employee(IdMixin, TimestampMixin, SoftDeleteMixin, VersionMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "employees"
    __table_args__ = (
        Index("uq_employee_no_live", "company_id", "employee_no", unique=True, postgresql_where=text("deleted_at IS NULL")),
        Index("uq_employee_user_live", "company_id", "user_id", unique=True, postgresql_where=text("deleted_at IS NULL")),
    )

    user_id: UUID = Field(foreign_key="users.id", index=True)
    employee_no: str
    branch_id: UUID = Field(foreign_key="branches.id", index=True)
    job_title: str | None = None
    contract_type: str | None = None
    has_smartphone: bool = True
    require_selfie: bool = False
    pin_hash: str | None = None
    badge_token: str | None = Field(default=None, index=True)
    photo_key: str | None = None
    start_date: date | None = None
    status: str = "invited"  # invited | active | deactivated


class EmployeeSite(IdMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "employee_sites"
    __table_args__ = (Index("uq_employee_site", "employee_id", "site_id", unique=True),)

    employee_id: UUID = Field(foreign_key="employees.id", index=True)
    site_id: UUID = Field(foreign_key="sites.id", index=True)
    is_default: bool = False


class EmployeeNote(IdMixin, TimestampMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "employee_notes"

    employee_id: UUID = Field(foreign_key="employees.id", index=True)
    author_user_id: UUID
    body: str


class Device(IdMixin, TimestampMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "devices"
    __table_args__ = (
        Index("uq_device_active", "employee_id", unique=True, postgresql_where=text("revoked_at IS NULL")),
    )

    employee_id: UUID = Field(foreign_key="employees.id", index=True)
    device_id_hash: str = Field(index=True)
    platform: str
    model: str | None = None
    app_version: str | None = None
    push_token: str | None = None
    attestation_status: str = "unverified"  # unverified | passed | failed
    registered_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False, server_default=text("now()")))
    last_active_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    revoked_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
