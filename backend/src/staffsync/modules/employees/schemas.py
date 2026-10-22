from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class EmployeeCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    employee_no: str = Field(min_length=1, max_length=30)
    email: EmailStr | None = None
    phone: str | None = None
    branch_id: UUID
    job_title: str | None = None
    contract_type: str | None = None
    start_date: date | None = None
    has_smartphone: bool = True
    require_selfie: bool = False
    site_ids: list[UUID] = []
    default_site_id: UUID | None = None
    send_invite: bool = True


class EmployeeUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    employee_no: str | None = Field(default=None, min_length=1, max_length=30)
    email: EmailStr | None = None
    phone: str | None = None
    branch_id: UUID | None = None
    job_title: str | None = None
    contract_type: str | None = None
    start_date: date | None = None
    has_smartphone: bool | None = None
    require_selfie: bool | None = None
    site_ids: list[UUID] | None = None
    default_site_id: UUID | None = None


class EmployeeRead(BaseModel):
    id: UUID
    user_id: UUID
    full_name: str
    employee_no: str
    email: str | None
    phone: str | None
    branch_id: UUID
    job_title: str | None
    contract_type: str | None
    start_date: date | None
    has_smartphone: bool
    require_selfie: bool
    status: str
    app_status: str  # installed | invited | no_smartphone
    site_ids: list[UUID]
    default_site_id: UUID | None
    version: int
    deleted_at: str | None = None


class EmployeeCreated(EmployeeRead):
    badge_pin: str | None = None  # shown once
    badge_token: str | None = None


class BadgeOut(BaseModel):
    badge_token: str
    pin: str  # shown once
    qr_svg: str


class DeviceRegisterIn(BaseModel):
    device_id: str = Field(min_length=8, max_length=200)
    platform: str = Field(pattern="^(ios|android)$")
    model: str | None = None
    app_version: str | None = None
    push_token: str | None = None
    attestation_token: str | None = None


class PushTokenIn(BaseModel):
    push_token: str = Field(min_length=10, max_length=4096)


class DeviceRead(BaseModel):
    registered: bool
    this_device: bool = False
    model: str | None = None
    platform: str | None = None
    app_version: str | None = None
    registered_at: datetime | None = None
    last_active_at: datetime | None = None


class NoteIn(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class NoteRead(BaseModel):
    id: UUID
    author: str | None
    body: str
    created_at: datetime
