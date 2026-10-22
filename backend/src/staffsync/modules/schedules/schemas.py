from datetime import date, datetime, time
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class ScheduleBase(BaseModel):
    type: Literal["recurring", "intervention"] = "recurring"
    site_id: UUID
    title: str = Field(min_length=2, max_length=120)
    days_of_week: list[int] = []
    start_time: time
    end_time: time
    crosses_midnight: bool = False
    break_min: int = Field(default=0, ge=0, le=480)
    grace_min: int = Field(default=10, ge=0, le=120)
    early_leave_tol_min: int = Field(default=10, ge=0, le=120)
    valid_from: date
    valid_to: date | None = None
    rotation: dict | None = None
    instructions: str | None = None
    priority: Literal["low", "normal", "high"] | None = None
    attachments: list[dict] = []
    employee_ids: list[UUID] = []

    @model_validator(mode="after")
    def _check(self):
        if self.type == "recurring" and not self.days_of_week and not (self.rotation and self.rotation.get("pattern")):
            raise ValueError("A recurring schedule needs days of the week")
        if any(d < 0 or d > 6 for d in self.days_of_week):
            raise ValueError("days_of_week must be 0 (Mon) to 6 (Sun)")
        if self.valid_to and self.valid_to < self.valid_from:
            raise ValueError("valid_to is before valid_from")
        if self.type == "intervention":
            self.valid_to = self.valid_from
        return self


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=120)
    site_id: UUID | None = None
    days_of_week: list[int] | None = None
    start_time: time | None = None
    end_time: time | None = None
    crosses_midnight: bool | None = None
    break_min: int | None = Field(default=None, ge=0, le=480)
    grace_min: int | None = Field(default=None, ge=0, le=120)
    early_leave_tol_min: int | None = Field(default=None, ge=0, le=120)
    valid_from: date | None = None
    valid_to: date | None = None
    rotation: dict | None = None
    instructions: str | None = None
    priority: Literal["low", "normal", "high"] | None = None
    attachments: list[dict] | None = None
    employee_ids: list[UUID] | None = None


class ScheduleRead(ScheduleBase):
    id: UUID
    status: str
    deleted_at: str | None = None


class Conflict(BaseModel):
    code: str  # OVERLAP | ON_LEAVE | HOLIDAY | NOT_ASSIGNED_TO_SITE
    employee_id: UUID
    starts_at: datetime
    detail: str


class ValidateOut(BaseModel):
    conflicts: list[Conflict]
    occurrences: int


class PublishIn(BaseModel):
    schedule_ids: list[UUID] = Field(min_length=1)
    notify: bool = True
    confirm_conflicts: bool = False


class CopyWeekIn(BaseModel):
    from_week: date  # any date in the source week
    to_week: date
    site_id: UUID | None = None
    employee_ids: list[UUID] | None = None


class DeleteScheduleIn(BaseModel):
    reason: str = Field(min_length=3, max_length=500)
    end_from: date | None = None


class ShiftMove(BaseModel):
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    notify: bool = True


class ShiftRead(BaseModel):
    id: UUID
    employee_id: UUID
    employee_name: str | None = None
    site_id: UUID
    site_name: str | None = None
    schedule_id: UUID
    title: str | None = None
    is_intervention: bool
    starts_at: datetime
    ends_at: datetime
    status: str
    exception: bool


class AssignmentRead(BaseModel):
    """What the mobile app shows for a shift (times are local to the site)."""

    id: UUID
    type: Literal["shift", "intervention"]
    site: dict
    date: date
    start: str  # HH:mm local
    end: str
    starts_at: datetime
    ends_at: datetime
    grace_min: int
    early_leave_tol_min: int
    instructions: str | None = None
    updated_by_admin: bool = False
    previous_start: str | None = None
    attachments: list[dict] = []
    status: str = "scheduled"
