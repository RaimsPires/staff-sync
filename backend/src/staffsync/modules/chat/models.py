from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Index, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Column, Field, SQLModel

from staffsync.common.models import IdMixin, TenantMixin, TimestampMixin


class Conversation(IdMixin, TimestampMixin, TenantMixin, SQLModel, table=True):
    """`direct`: two people of the company. `site`: the group of one site (members are whoever is attached to it)."""

    __tablename__ = "chat_conversations"
    __table_args__ = (
        Index("uq_chat_site", "company_id", "site_id", unique=True, postgresql_where=text("kind = 'site'")),
        Index("uq_chat_direct", "company_id", "user_a", "user_b", unique=True, postgresql_where=text("kind = 'direct'")),
    )

    kind: str  # direct | site
    site_id: UUID | None = Field(default=None, foreign_key="sites.id")
    user_a: UUID | None = Field(default=None, foreign_key="users.id")  # direct only; user_a < user_b so a pair has one row
    user_b: UUID | None = Field(default=None, foreign_key="users.id")
    last_message_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    last_message_preview: str | None = None


class Message(IdMixin, TimestampMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "chat_messages"
    __table_args__ = (Index("ix_chat_msg_conv", "conversation_id", "created_at"),)

    conversation_id: UUID = Field(foreign_key="chat_conversations.id")
    sender_user_id: UUID = Field(foreign_key="users.id")
    body: str = ""
    # [{"key": storage key, "name": file name, "content_type": ..., "size": bytes}]
    attachments: list = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))
    deleted_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))


class ReadMark(IdMixin, TimestampMixin, TenantMixin, SQLModel, table=True):
    """How far each person has read a conversation; unread = messages from others after `last_read_at`."""

    __tablename__ = "chat_reads"
    __table_args__ = (Index("uq_chat_read", "conversation_id", "user_id", unique=True),)

    conversation_id: UUID = Field(foreign_key="chat_conversations.id")
    user_id: UUID = Field(foreign_key="users.id")
    last_read_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
