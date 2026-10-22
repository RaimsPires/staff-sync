from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class CorrectionIn(BaseModel):
    kind: Literal["forgot_checkout", "wrong_time", "flagged_incorrectly"]
    proposed_in: datetime | None = None
    proposed_out: datetime | None = None
    comment: str = Field(min_length=3, max_length=1000)
    attachment_key: str | None = None

    @model_validator(mode="after")
    def _needs_time(self):
        if self.kind == "forgot_checkout" and not self.proposed_out:
            raise ValueError("proposed_out is required when the check-out was forgotten")
        if self.kind == "wrong_time" and not (self.proposed_in or self.proposed_out):
            raise ValueError("Propose the correct time")
        return self


class CorrectionRead(BaseModel):
    id: UUID
    record_id: UUID
    employee_id: UUID
    kind: str
    proposed_in: datetime | None
    proposed_out: datetime | None
    comment: str
    attachment_key: str | None
    status: str
    admin_response: str | None
    decided_at: datetime | None
    created_at: datetime


class DeclineIn(BaseModel):
    reason: str = Field(min_length=3, max_length=1000)


class AcceptIn(BaseModel):
    note: str | None = Field(default=None, max_length=1000)
