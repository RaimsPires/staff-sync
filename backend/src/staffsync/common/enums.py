from enum import StrEnum


class Perm(StrEnum):
    ATTENDANCE_VIEW = "attendance.view"
    ATTENDANCE_EDIT = "attendance.edit"
    ATTENDANCE_PROXY = "attendance.proxy_checkin"
    ALERTS_VIEW = "alerts.view"
    ALERTS_RESOLVE = "alerts.resolve"
    EMPLOYEES_VIEW = "employees.view"
    EMPLOYEES_MANAGE = "employees.manage"
    DEVICES_RESET = "devices.reset"
    SITES_VIEW = "sites.view"
    SITES_MANAGE = "sites.manage"
    BRANCHES_VIEW = "branches.view"
    BRANCHES_MANAGE = "branches.manage"
    SCHEDULES_VIEW = "schedules.view"
    SCHEDULES_MANAGE = "schedules.manage"
    LEAVE_VIEW = "leave.view"
    LEAVE_RECOMMEND = "leave.recommend"
    LEAVE_APPROVE = "leave.approve"
    LEAVE_SETTINGS = "leave.settings"
    REPORTS_VIEW = "reports.view"
    REPORTS_EXPORT = "reports.export"
    USERS_MANAGE = "users.manage"
    ROLES_MANAGE = "roles.manage"
    AUDIT_VIEW = "audit.view"
    SETTINGS_MANAGE = "settings.manage"
    BILLING_MANAGE = "billing.manage"
    CHAT_SITES = "chat.sites"  # write in the chat group of any site in scope, without being attached to it


class ScopeType(StrEnum):
    COMPANY = "company"
    BRANCHES = "branches"
    BRANCH_OWN = "branch_own"
    SITES = "sites"
    SITE_OWN = "site_own"
    SELF = "self"


