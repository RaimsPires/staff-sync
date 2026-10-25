from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class PersonOut(BaseModel):
    id: UUID
    name: str
    title: str | None = None
    avatar_url: str | None = None


class AttachmentIn(BaseModel):
    key: str = Field(min_length=3, max_length=300)
    name: str = Field(min_length=1, max_length=200)
    content_type: str = Field(max_length=100)
    size: int = Field(ge=0, le=100_000_000)


class AttachmentOut(AttachmentIn):
    url: str  # short-lived download link


class MessageIn(BaseModel):
    body: str = Field(default="", max_length=4000)
    attachments: list[AttachmentIn] = Field(default_factory=list, max_length=6)


class MessageOut(BaseModel):
    id: UUID
    conversation_id: UUID
    sender: PersonOut
    body: str
    attachments: list[AttachmentOut]
    created_at: datetime


class ConversationOut(BaseModel):
    id: UUID
    kind: Literal["direct", "site"]
    title: str
    site_id: UUID | None = None
    other: PersonOut | None = None  # the other person of a direct conversation
    last_message_at: datetime | None = None
    last_message_preview: str | None = None
    unread: int = 0
    can_write: bool = True
    members: int | None = None  # people attached to the site


class DirectIn(BaseModel):
    user_id: UUID


class TicketOut(BaseModel):
    ticket: str
    expires_in: int
