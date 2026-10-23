from dataclasses import dataclass, field
from uuid import UUID

from sqlmodel.ext.asyncio.session import AsyncSession

from staffsync.common.enums import Perm
from staffsync.core.errors import Forbidden, NotFound
from staffsync.modules.auth.models import User


@dataclass(frozen=True)
class Scope:
    """Where a user may act. `None` sets mean unrestricted."""

    site_ids: frozenset[UUID] | None = None
    branch_ids: frozenset[UUID] | None = None
    self_only: bool = False


@dataclass
class RequestContext:
    session: AsyncSession
    user: User
    company_id: UUID
    session_id: UUID
    perms: frozenset[str]
    scope: Scope
    employee_id: UUID | None = None
    device_hash: str | None = None
    request_id: str | None = None
    ip: str | None = None
    user_agent: str | None = None
    role_names: list[str] = field(default_factory=list)

    def has(self, perm: Perm) -> bool:
        return perm.value in self.perms

    def require(self, perm: Perm) -> None:
        if not self.has(perm):
            raise Forbidden(f"Missing permission {perm.value}", code="MISSING_PERMISSION", permission=perm.value)

    def require_employee(self) -> UUID:
        if self.employee_id is None:
            raise Forbidden("This action is for employees")
        return self.employee_id

    def site_allowed(self, site_id: UUID) -> bool:
        return self.scope.site_ids is None or site_id in self.scope.site_ids

    def ensure_site(self, site_id: UUID) -> None:
        """Out-of-scope ids look like missing ones (404), so other branches' ids are not revealed."""
        if not self.site_allowed(site_id):
            raise NotFound()

    def branch_allowed(self, branch_id: UUID) -> bool:
        return self.scope.branch_ids is None or branch_id in self.scope.branch_ids

    @property
    def actor_label(self) -> str:
        return self.user.full_name
