from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

Half = Literal["morning", "afternoon"]


class LeaveTypeIn(BaseModel):
    name_en: str = Field(min_length=2, max_length=60)
    name_fr: str = Field(min_length=2, max_length=60)
    color: str = Field(default="#2563eb", pattern=r"^#[0-9a-fA-F]{6}$")
    paid: bool = True
    yearly_allowance: float = Field(default=0, ge=0, le=366)
    requires_document: bool = False
    min_notice_days: int = Field(default=0, ge=0, le=365)
    half_day_allowed: bool = True
    carry_over_max: float = Field(default=0, ge=0, le=366)


class LeaveTypePatch(BaseModel):
    name_en: str | None = None
    name_fr: str | None = None
    color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    paid: bool | None = None
    yearly_allowance: float | None = Field(default=None, ge=0, le=366)
    requires_document: bool | None = None
    min_notice_days: int | None = Field(default=None, ge=0, le=365)
    half_day_allowed: bool | None = None
    carry_over_max: float | None = Field(default=None, ge=0, le=366)


class LeaveTypeRead(LeaveTypeIn):
    id: UUID
    deleted_at: str | None = None


class LeaveDraft(BaseModel):
    leave_type_id: UUID
    start_date: date
    end_date: date
    start_half: Half | None = None
    end_half: Half | None = None
    reason: str = Field(default="", max_length=1000)
    attachment_keys: list[str] = []

    @model_validator(mode="after")
    def _order(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date is before start_date")
        return self


class Warning_(BaseModel):
    code: str  # EXCEEDS_BALANCE | SHORT_NOTICE | OVERLAPS_LEAVE | OVERLAPS_INTERVENTION | DOCUMENT_REQUIRED
    detail: str | None = None


class PreviewOut(BaseModel):
    days: float
    remaining_after: float
    warnings: list[Warning_]
    reviewer: str | None


class TimelineEntry(BaseModel):
    actor: str | None
    action: str
    at: datetime
    comment: str | None = None


class LeaveRead(BaseModel):
    id: UUID
    employee_id: UUID
    employee_name: str | None = None
    leave_type_id: UUID
    start_date: date
    end_date: date
    start_half: str | None
    end_half: str | None
    days: float
    reason: str
    attachment_keys: list[str]
    status: str
    levels: int
    approver: str | None = None
    recommendation: str | None = None
    recommendation_comment: str | None = None
    timeline: list[TimelineEntry] = []
    created_at: datetime


class DecisionIn(BaseModel):
    comment: str | None = Field(default=None, max_length=1000)


class RecommendIn(BaseModel):
    decision: Literal["approve", "reject"]
    comment: str = Field(min_length=1, max_length=1000)


class BulkDecisionIn(BaseModel):
    ids: list[UUID] = Field(min_length=1, max_length=100)
    action: Literal["approve", "reject"]
    reason: str | None = Field(default=None, max_length=1000)


class AdjustIn(BaseModel):
    delta: float = Field(ge=-366, le=366)
    reason: str = Field(min_length=3, max_length=500)


class HolidayIn(BaseModel):
    calendar_id: UUID
    date: date
    name: str = Field(min_length=2, max_length=120)


class CalendarIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
