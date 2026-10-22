from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from staffsync.common.enums import Perm, ScopeType


class ScopeIn(BaseModel):
    scope_type: ScopeType = ScopeType.COMPANY
    scope_ids: list[UUID] = []


class RoleCreate(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    description: str | None = None
    permissions: list[Perm] = []


class RoleUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=60)
    description: str | None = None
    permissions: list[Perm] | None = None


class RoleRead(BaseModel):
    id: UUID
    name: str
    description: str | None
    is_system: bool
    key: str | None
    permissions: list[str]
    users_count: int = 0


class InviteIn(ScopeIn):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=120)
    role_id: UUID
    message: str | None = None


class UserRolesIn(ScopeIn):
    role_id: UUID


class UserRead(BaseModel):
    id: UUID
    full_name: str
    email: str | None
    status: str
    roles: list[dict]
    last_active_at: str | None = None


class PreviewIn(ScopeIn):
    permissions: list[Perm]
