from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CompanyRead(BaseModel):
    id: UUID
    name: str
    logo_url: str | None = None
    industry: str | None
    size: str | None
    country: str
    timezone: str
    locale: str
    plan: str
    status: str
    subscription_status: str | None
    seat_limit: int
    trial_ends_at: datetime | None
    onboarding_step: int
    onboarding_done: bool
    retention_days: int


class CompanyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    industry: str | None = None
    size: str | None = None
    country: str | None = Field(default=None, min_length=2, max_length=2)
    timezone: str | None = None
    locale: str | None = Field(default=None, pattern="^(en|fr)$")
    retention_days: int | None = Field(default=None, ge=30, le=3650)
    onboarding_step: int | None = Field(default=None, ge=1, le=8)
    onboarding_done: bool | None = None


class UploadRequest(BaseModel):
    content_type: str = Field(pattern="^image/(png|jpeg|webp)$")
    size_bytes: int = Field(gt=0, le=5_000_000)


class DeleteCompanyIn(BaseModel):
    confirm_name: str
    reason: str | None = None
