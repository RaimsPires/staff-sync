"""System roles and their default permissions/scopes."""

from staffsync.common.enums import Perm, ScopeType

ALL = [p for p in Perm]

VIEW_ONLY = [
    Perm.ATTENDANCE_VIEW, Perm.ALERTS_VIEW, Perm.EMPLOYEES_VIEW, Perm.SITES_VIEW, Perm.BRANCHES_VIEW,
    Perm.SCHEDULES_VIEW, Perm.LEAVE_VIEW, Perm.REPORTS_VIEW, Perm.REPORTS_EXPORT,
]

BRANCH_ADMIN = [
    p for p in Perm
    if p not in {Perm.ROLES_MANAGE, Perm.BILLING_MANAGE, Perm.SETTINGS_MANAGE, Perm.LEAVE_SETTINGS, Perm.USERS_MANAGE, Perm.BRANCHES_MANAGE}
]

SITE_MANAGER = [
    Perm.ATTENDANCE_VIEW, Perm.ATTENDANCE_PROXY, Perm.ALERTS_VIEW, Perm.EMPLOYEES_VIEW, Perm.SITES_VIEW,
    Perm.SCHEDULES_VIEW, Perm.LEAVE_VIEW, Perm.LEAVE_RECOMMEND,
]

# key -> (name, description, permissions, default scope)
SYSTEM_ROLES: dict[str, tuple[str, str, list[Perm], ScopeType]] = {
    "owner": ("Super admin", "Full access to the whole company, including billing and roles.", ALL, ScopeType.COMPANY),
    "branch_admin": ("Branch admin", "Manages employees, sites, schedules, leave and alerts for assigned branches.", BRANCH_ADMIN, ScopeType.BRANCHES),
    "site_manager": ("Site manager", "Live board and proxy check-in for assigned sites.", SITE_MANAGER, ScopeType.SITES),
    "viewer": ("HR / Viewer", "Read-only access to attendance, leave and reports.", VIEW_ONLY, ScopeType.COMPANY),
    "employee": ("Employee", "Mobile app access to own data only.", [], ScopeType.SELF),
}
