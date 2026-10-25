"""Import every table model so SQLModel.metadata (and Alembic) sees the whole schema."""

from staffsync.core.outbox import OutboxEvent  # noqa: F401
from staffsync.modules.alerts.models import Alert, AlertNote  # noqa: F401
from staffsync.modules.attendance.models import AttendanceNote, AttendanceRecord  # noqa: F401
from staffsync.modules.audit.models import AuditLog  # noqa: F401
from staffsync.modules.auth.models import CompanyMember, Invitation, RefreshToken, User  # noqa: F401
from staffsync.modules.billing.models import StripeEvent  # noqa: F401
from staffsync.modules.branches.models import Branch  # noqa: F401
from staffsync.modules.chat.models import Conversation, Message, ReadMark  # noqa: F401
from staffsync.modules.companies.models import ApiKey, Company  # noqa: F401
from staffsync.modules.corrections.models import CorrectionRequest  # noqa: F401
from staffsync.modules.employees.models import Device, Employee, EmployeeNote, EmployeeSite  # noqa: F401
from staffsync.modules.leave.models import (  # noqa: F401
    Holiday,
    HolidayCalendar,
    LeaveApproval,
    LeaveBalance,
    LeaveRequest,
    LeaveType,
)
from staffsync.modules.notifications.models import Notification  # noqa: F401
from staffsync.modules.reports.models import SavedReport  # noqa: F401
from staffsync.modules.schedules.models import Schedule, ScheduleAssignment, Shift  # noqa: F401
from staffsync.modules.sites.models import Site, SiteManager  # noqa: F401
from staffsync.modules.users_roles.models import Role, RolePermission, UserRole  # noqa: F401
from staffsync.modules.webhooks.models import Webhook, WebhookDelivery  # noqa: F401
