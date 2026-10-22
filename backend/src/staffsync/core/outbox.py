"""Transactional outbox: events are written in the request transaction and relayed by the worker."""

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import DateTime, Index, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Column, Field, SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from staffsync.common.models import IdMixin


class OutboxEvent(IdMixin, SQLModel, table=True):
    __tablename__ = "outbox_events"
    __table_args__ = (Index("ix_outbox_pending", "created_at", postgresql_where=text("status = 'pending'")),)

    company_id: UUID = Field(index=True)
    event_type: str
    payload: dict = Field(default_factory=dict, sa_column=Column(JSONB, nullable=False))
    status: str = "pending"  # pending | sent | failed
    attempts: int = 0
    created_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False, server_default=text("now()")))
    sent_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))


def emit(session: AsyncSession, company_id: UUID, event_type: str, payload: dict[str, Any]) -> None:
    """Queue a domain event (CheckInRecorded, LeaveApproved, ...). Committed with the surrounding transaction."""
    session.add(OutboxEvent(company_id=company_id, event_type=event_type, payload=payload))
