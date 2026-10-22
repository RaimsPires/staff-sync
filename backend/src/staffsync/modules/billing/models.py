from datetime import datetime

from sqlalchemy import DateTime, text
from sqlmodel import Column, Field, SQLModel


class StripeEvent(SQLModel, table=True):
    """Dedupe table: a Stripe event id is processed once."""

    __tablename__ = "stripe_events"

    id: str = Field(primary_key=True)
    type: str
    processed_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    created_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False, server_default=text("now()")))
