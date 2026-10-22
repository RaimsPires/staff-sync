from datetime import datetime
from uuid import UUID

from geoalchemy2 import Geography
from sqlalchemy import DateTime, Index, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlmodel import Column, Field, SQLModel, String

from staffsync.common.models import IdMixin, SoftDeleteMixin, TenantMixin, TimestampMixin, VersionMixin


class AttendanceRecord(IdMixin, TimestampMixin, SoftDeleteMixin, VersionMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "attendance_records"
    __table_args__ = (
        Index("ix_att_site_in", "company_id", "site_id", "occurred_at", postgresql_where=text("deleted_at IS NULL")),
        Index("ix_att_employee_in", "employee_id", "occurred_at"),
        Index("uq_att_client_event", "employee_id", "client_event_id", unique=True, postgresql_where=text("client_event_id IS NOT NULL")),
    )

    employee_id: UUID = Field(foreign_key="employees.id")
    site_id: UUID = Field(foreign_key="sites.id")
    shift_id: UUID | None = Field(default=None, foreign_key="shifts.id")
    occurred_at: datetime = Field(sa_type=DateTime(timezone=True))  # check-in time, else the shift start / manual time; drives ordering
    check_in_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    check_out_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    in_point: str | None = Field(default=None, sa_column=Column(Geography("POINT", srid=4326, spatial_index=False)))
    out_point: str | None = Field(default=None, sa_column=Column(Geography("POINT", srid=4326, spatial_index=False)))
    in_accuracy_m: float | None = None
    out_accuracy_m: float | None = None
    distance_m: float | None = None
    out_distance_m: float | None = None
    method: str = "self"
    actor_user_id: UUID | None = None
    status: str = "on_time"
    late_min: int | None = None
    early_min: int | None = None
    overtime_min: int | None = None
    worked_min: int | None = None
    flags: list[dict] = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))
    flag_outcome: str | None = None  # pending | approved | rejected
    selfie_keys: list[str] = Field(default_factory=list, sa_column=Column(ARRAY(String), nullable=False, server_default="{}"))
    offline_synced: bool = False
    client_event_id: str | None = None
    out_client_event_id: str | None = None
    employee_comment: str | None = None
    checkout_note: str | None = None
    device_hash: str | None = None
    notes: str | None = None
    edit_history: list[dict] = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))


class AttendanceNote(IdMixin, TimestampMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "attendance_notes"

    record_id: UUID = Field(foreign_key="attendance_records.id", index=True)
    author_user_id: UUID
    body: str
