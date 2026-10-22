from uuid import UUID

from sqlmodel.ext.asyncio.session import AsyncSession

from staffsync.modules.users_roles.catalog import SYSTEM_ROLES
from staffsync.modules.users_roles.models import Role, RolePermission, UserRole


async def seed_company_roles(session: AsyncSession, company_id: UUID) -> dict[str, Role]:
    """Create the five system roles for a new company. Returns them by key."""
    roles: dict[str, Role] = {}
    for key, (name, description, perms, _scope) in SYSTEM_ROLES.items():
        role = Role(company_id=company_id, name=name, description=description, is_system=True, key=key)
        session.add(role)
        await session.flush()
        for p in perms:
            session.add(RolePermission(role_id=role.id, permission=p.value))
        roles[key] = role
    return roles


async def assign_role(session: AsyncSession, company_id: UUID, user_id: UUID, role: Role, scope_type: str, scope_ids: list[UUID] | None = None) -> UserRole:
    ur = UserRole(company_id=company_id, user_id=user_id, role_id=role.id, scope_type=scope_type, scope_ids=scope_ids or [])
    session.add(ur)
    await session.flush()
    return ur
