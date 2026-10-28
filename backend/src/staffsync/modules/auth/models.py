from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Index, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Column, Field, SQLModel

from staffsync.common.models import IdMixin, SoftDeleteMixin, TenantMixin, TimestampMixin


class User(IdMixin, TimestampMixin, SoftDeleteMixin, SQLModel, table=True):
    """One row per person across companies; access to a company goes through CompanyMember."""

    __tablename__ = "users"
    __table_args__ = (
        Index("uq_users_email_live", "email", unique=True, postgresql_where=text("deleted_at IS NULL AND email IS NOT NULL")),
        Index("uq_users_phone_live", "phone", unique=True, postgresql_where=text("deleted_at IS NULL AND phone IS NOT NULL")),
    )

    full_name: str
    email: str | None = None
    phone: str | None = None  # E.164
    email_verified: bool = False
    password_hash: str | None = None
    must_change_password: bool = False  # the password was generated and sent to the person: they choose their own at first sign-in
    totp_secret: str | None = None  # encrypted at rest
    totp_enabled: bool = False
    backup_codes: list[str] | None = Field(default=None, sa_column=Column("backup_codes", JSONB))
    locale: str = "en"
    avatar_key: str | None = None  # profile photo in object storage
    theme: str = "system"
    notification_prefs: dict | None = Field(default=None, sa_column=Column("notification_prefs", JSONB))
    status: str = "active"  # active | disabled
    failed_logins: int = 0
    locked_until: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    last_login_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))


class CompanyMember(IdMixin, TimestampMixin, SoftDeleteMixin, TenantMixin, SQLModel, table=True):
    """A person's membership in a company (dashboard user and/or employee)."""

    __tablename__ = "company_members"
    __table_args__ = (
        Index("uq_member_live", "company_id", "user_id", unique=True, postgresql_where=text("deleted_at IS NULL")),
    )

    user_id: UUID = Field(foreign_key="users.id", index=True)
    status: str = "active"  # invited | active | revoked
    is_owner: bool = False
    last_active_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))


class Invitation(IdMixin, TimestampMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "invitations"

    user_id: UUID = Field(foreign_key="users.id")
    token_hash: str = Field(index=True)
    role_id: UUID | None = None
    scope_type: str | None = None
    scope_ids: list[str] | None = Field(default=None, sa_column=Column("scope_ids", JSONB))
    invited_by: UUID | None = None
    message: str | None = None
    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    accepted_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))


class RefreshToken(IdMixin, SQLModel, table=True):
    """Opaque refresh tokens, stored hashed. `family_id` doubles as the session id (`sid` claim)."""

    __tablename__ = "refresh_tokens"

    user_id: UUID = Field(foreign_key="users.id", index=True)
    company_id: UUID | None = Field(default=None, foreign_key="companies.id")
    family_id: UUID = Field(index=True)
    token_hash: str = Field(index=True, unique=True)
    channel: str = "web"  # web | mobile
    device_hash: str | None = None
    user_agent: str | None = None
    ip: str | None = None
    created_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False, server_default=text("now()")))
    last_used_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    rotated_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    revoked_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
