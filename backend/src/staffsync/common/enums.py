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


class ScopeType(StrEnum):
    COMPANY = "company"
    BRANCHES = "branches"
    BRANCH_OWN = "branch_own"
    SITES = "sites"
    SITE_OWN = "site_own"
    SELF = "self"


class FlagReason(StrEnum):
    OUTSIDE_GEOFENCE = "OUTSIDE_GEOFENCE"
    MOCK_LOCATION = "MOCK_LOCATION"
    LOW_ACCURACY = "LOW_ACCURACY"
    TIME_TAMPERED = "TIME_TAMPERED"
    UNSCHEDULED = "UNSCHEDULED"
    DEVICE_MISMATCH = "DEVICE_MISMATCH"
    IMPOSSIBLE_TRAVEL = "IMPOSSIBLE_TRAVEL"
    SELFIE_MISSING = "SELFIE_MISSING"
    QR_INVALID = "QR_INVALID"
    LATE_SYNC = "LATE_SYNC"


class AttendanceStatus(StrEnum):
    ON_TIME = "on_time"
    LATE = "late"
    EARLY_LEAVE = "early_leave"
    OVERTIME = "overtime"
    MISSING_CHECKOUT = "missing_checkout"
    ABSENT = "absent"
    ON_LEAVE = "on_leave"
    HOLIDAY = "holiday"
    FLAGGED = "flagged"


class CheckMethod(StrEnum):
    SELF = "self"
    PROXY = "proxy"
    ADMIN = "admin"
    QR = "qr"
    MANUAL = "manual"


class FlagOutcome(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ShiftStatus(StrEnum):
    SCHEDULED = "scheduled"
    ON_LEAVE = "on_leave"
    CANCELLED = "cancelled"


class AlertType(StrEnum):
    FLAGGED = "flagged"
    MISSING_CHECKOUT = "missing_checkout"
    UNSCHEDULED = "unscheduled"
    UNCOVERED_INTERVENTION = "uncovered_intervention"


class AlertStatus(StrEnum):
    OPEN = "open"
    ESCALATED = "escalated"
    APPROVED = "approved"
    REJECTED = "rejected"


class CorrectionKind(StrEnum):
    FORGOT_CHECKOUT = "forgot_checkout"
    WRONG_TIME = "wrong_time"
    FLAGGED_INCORRECTLY = "flagged_incorrectly"


class CorrectionStatus(StrEnum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    CANCELLED = "cancelled"


class LeaveStatus(StrEnum):
    PENDING = "pending"
    RECOMMENDED = "recommended"
    CHANGES_REQUESTED = "changes_requested"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLATION_REQUESTED = "cancellation_requested"
    CANCELLED = "cancelled"


class EmployeeStatus(StrEnum):
    INVITED = "invited"
    ACTIVE = "active"
    DEACTIVATED = "deactivated"
