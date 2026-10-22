"""Resolve a user's effective permissions and data scope inside one company."""

from uuid import UUID

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from staffsync.common.enums import ScopeType
from staffsync.core.context import Scope
from staffsync.modules.employees.models import Employee, EmployeeSite
from staffsync.modules.sites.models import Site, SiteManager
from staffsync.modules.users_roles.models import Role, RolePermission, UserRole


async def resolve_access(session: AsyncSession, company_id: UUID, user_id: UUID) -> tuple[frozenset[str], Scope, list[str], UUID | None]:
    rows = (
        await session.exec(  # type: ignore[call-overload]
            select(UserRole, Role).join(Role, Role.id == UserRole.role_id).where(UserRole.company_id == company_id, UserRole.user_id == user_id)
        )
    ).all()
    role_ids = [r.id for _, r in rows]
    perms: set[str] = set()
    if role_ids:
        perms = set((await session.exec(select(RolePermission.permission).where(RolePermission.role_id.in_(role_ids)))).all())  # type: ignore[attr-defined]

    employee = (
        await session.exec(select(Employee).where(Employee.company_id == company_id, Employee.user_id == user_id, Employee.status != "deactivated"))
    ).first()
    own_sites: set[UUID] = set()
    if employee:
        own_sites = set((await session.exec(select(EmployeeSite.site_id).where(EmployeeSite.employee_id == employee.id))).all())
    managed = set((await session.exec(select(SiteManager.site_id).where(SiteManager.user_id == user_id, SiteManager.company_id == company_id))).all())

    unrestricted = False
    branch_ids: set[UUID] = set()
    site_ids: set[UUID] = set()
    for ur, _role in rows:
        st = ScopeType(ur.scope_type)
        if st is ScopeType.COMPANY:
            unrestricted = True
        elif st is ScopeType.BRANCHES:
            branch_ids |= set(ur.scope_ids)
        elif st is ScopeType.BRANCH_OWN and employee:
            branch_ids.add(employee.branch_id)
        elif st is ScopeType.SITES:
            site_ids |= set(ur.scope_ids)
        elif st is ScopeType.SITE_OWN:
            site_ids |= own_sites | managed
    site_ids |= managed  # a site manager always covers the sites they manage

    if unrestricted:
        scope = Scope(site_ids=None, branch_ids=None)
    else:
        if branch_ids:
            site_ids |= set((await session.exec(select(Site.id).where(Site.branch_id.in_(branch_ids)))).all())  # type: ignore[attr-defined]
        scope = Scope(site_ids=frozenset(site_ids), branch_ids=frozenset(branch_ids), self_only=not (site_ids or branch_ids))
    return frozenset(perms), scope, [r.name for _, r in rows], employee.id if employee else None
