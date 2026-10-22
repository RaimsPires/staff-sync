from uuid import UUID

from sqlalchemy import Index, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlmodel import Column, Field, SQLModel

from staffsync.common.models import IdMixin, SoftDeleteMixin, TenantMixin, TimestampMixin


class Role(IdMixin, TimestampMixin, SoftDeleteMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "roles"
    __table_args__ = (
        Index("uq_role_name_live", "company_id", "name", unique=True, postgresql_where=text("deleted_at IS NULL")),
    )

    name: str
    description: str | None = None
    is_system: bool = False
    key: str | None = None  # owner | branch_admin | site_manager | viewer | employee for system roles


class RolePermission(IdMixin, SQLModel, table=True):
    __tablename__ = "role_permissions"
    __table_args__ = (Index("uq_role_perm", "role_id", "permission", unique=True),)

    role_id: UUID = Field(foreign_key="roles.id", index=True)
    permission: str


class UserRole(IdMixin, TimestampMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "user_roles"

    user_id: UUID = Field(foreign_key="users.id", index=True)
    role_id: UUID = Field(foreign_key="roles.id", index=True)
    scope_type: str = "company"
    scope_ids: list[UUID] = Field(default_factory=list, sa_column=Column(ARRAY(PGUUID(as_uuid=True)), nullable=False, server_default="{}"))
