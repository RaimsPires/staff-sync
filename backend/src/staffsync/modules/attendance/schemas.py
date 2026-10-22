from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class CheckEventIn(BaseModel):
    client_event_id: str = Field(min_length=8, max_length=64)
    type: Literal["check_in", "check_out"] | None = None  # required by /sync, implied by the endpoint otherwise
    shift_id: UUID | None = None
    site_id: UUID | None = None
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    accuracy_m: float = Field(ge=0, le=100_000)
    captured_at: datetime
    is_mock_location: bool = False
    selfie_key: str | None = None
    qr_payload: str | None = None
    attestation_token: str | None = None
    method: Literal["self", "qr"] = "self"
    note: str | None = Field(default=None, max_length=500)
    accept_unscheduled: bool = False

    @field_validator("captured_at")
    @classmethod
    def _aware(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            raise ValueError("captured_at must include a timezone")
        return v


class SyncIn(BaseModel):
    events: list[CheckEventIn] = Field(min_length=1, max_length=50)


class FlagOut(BaseModel):
    reason: str
    distance_m: float | None = None
    detail: str | None = None


class RecordRead(BaseModel):
    id: UUID
    date: date  # local to the site
    employee_id: UUID
    employee_name: str | None = None
    site: dict
    shift_id: UUID | None
    scheduled_start: str | None  # HH:mm local
    scheduled_end: str | None
    check_in_at: datetime | None
    check_out_at: datetime | None
    status: str  # effective: 'flagged' while a flag awaits review
    base_status: str
    late_by_minutes: int | None
    early_by_minutes: int | None
    overtime_minutes: int | None
    worked_minutes: int | None
    method: str
    proxy_by: str | None = None
    flags: list[FlagOut]
    flag_outcome: str | None
    employee_comment: str | None
    admin_note: str | None
    offline_synced: bool
    distance_m: float | None = None
    in_accuracy_m: float | None = None
    version: int = 1
    deleted_at: str | None = None


class CheckResult(BaseModel):
    record: RecordRead
    flags: list[FlagOut]


class SyncItem(BaseModel):
    client_event_id: str
    ok: bool
    result: CheckResult | None = None
    error: dict | None = None


class SyncOut(BaseModel):
    results: list[SyncItem]


class ProxyIn(BaseModel):
    employee_id: UUID | None = None
    badge_token: str | None = None
    pin: str | None = Field(default=None, pattern=r"^\d{4}$")
    photo_key: str | None = None
    note: str | None = Field(default=None, max_length=500)
    site_id: UUID
    shift_id: UUID | None = None
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)
    accuracy_m: float = 10
    captured_at: datetime | None = None
    client_event_id: str = Field(min_length=8, max_length=64)
    accept_unscheduled: bool = False
    reason: str | None = Field(default=None, max_length=500)  # required for dashboard (non-geolocated) use


class VerifyPinIn(BaseModel):
    employee_id: UUID
    pin: str = Field(pattern=r"^\d{4}$")


class ManualRecordIn(BaseModel):
    employee_id: UUID
    site_id: UUID
    check_in_at: datetime
    check_out_at: datetime | None = None
    status: str | None = None
    reason: str = Field(min_length=3, max_length=500)
    notes: str | None = None
    evidence_key: str | None = None


class RecordPatch(BaseModel):
    check_in_at: datetime | None = None
    check_out_at: datetime | None = None
    status: str | None = None
    notes: str | None = None
    reason: str = Field(min_length=3, max_length=500)


class BulkIn(BaseModel):
    action: Literal["approve", "mark_absent"]
    record_ids: list[UUID] = []
    shift_ids: list[UUID] = []
    reason: str = Field(min_length=3, max_length=500)


class CommentIn(BaseModel):
    comment: str = Field(min_length=1, max_length=1000)


class NoteIn(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class RosterRow(BaseModel):
    employee_id: UUID
    name: str
    phone: str | None
    has_smartphone: bool
    shift_id: UUID
    scheduled_start: str
    scheduled_end: str
    check_in_at: datetime | None = None
    check_out_at: datetime | None = None
    status: str  # on_time | late | flagged | not_arrived | left | absent | on_leave | early_leave | overtime ...
    method: str | None = None
    distance_m: float | None = None
    flags: list[FlagOut] = []
    record_id: UUID | None = None
    note: str | None = None
    role: str | None = None


class Counters(BaseModel):
    expected: int = 0
    present: int = 0
    not_arrived: int = 0
    left: int = 0
    absent: int = 0
    on_leave: int = 0
    flagged: int = 0


class LiveSite(BaseModel):
    site_id: UUID
    site_name: str
    counters: Counters
    rows: list[RosterRow]
