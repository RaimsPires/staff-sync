from uuid import UUID

from pydantic import BaseModel, Field


class BranchCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    code: str = Field(min_length=1, max_length=20, pattern=r"^[A-Za-z0-9_-]+$")
    address: str | None = None
    timezone: str = "Africa/Douala"
    holiday_calendar_id: UUID | None = None
    leave_levels: int | None = Field(default=None, ge=1, le=2)
    admin_user_ids: list[UUID] = []


class BranchUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    code: str | None = Field(default=None, min_length=1, max_length=20, pattern=r"^[A-Za-z0-9_-]+$")
    address: str | None = None
    timezone: str | None = None
    holiday_calendar_id: UUID | None = None
    leave_levels: int | None = Field(default=None, ge=1, le=2)


class BranchRead(BaseModel):
    id: UUID
    name: str
    code: str
    address: str | None
    timezone: str
    holiday_calendar_id: UUID | None
    leave_levels: int | None
    status: str
    sites_count: int = 0
    employees_count: int = 0
    deleted_at: str | None = None
