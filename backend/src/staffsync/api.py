"""Collects every module router under /api/v1."""

from fastapi import APIRouter

from staffsync.modules.alerts.router import router as alerts_router
from staffsync.modules.attendance.router import router as attendance_router
from staffsync.modules.audit.router import router as audit_router
from staffsync.modules.auth.router import router as auth_router
from staffsync.modules.billing.router import router as billing_router
from staffsync.modules.branches.router import router as branches_router
from staffsync.modules.chat.router import router as chat_router
from staffsync.modules.companies.router import router as companies_router
from staffsync.modules.corrections.router import router as corrections_router
from staffsync.modules.dashboard.router import router as dashboard_router
from staffsync.modules.employees.router import router as employees_router
from staffsync.modules.files.router import router as files_router
from staffsync.modules.health.router import router as health_router
from staffsync.modules.leave.router import router as leave_router
from staffsync.modules.manager.router import router as manager_router
from staffsync.modules.notifications.router import router as notifications_router
from staffsync.modules.realtime.router import router as realtime_router
from staffsync.modules.reports.router import router as reports_router
from staffsync.modules.schedules.router import router as schedules_router
from staffsync.modules.settings.router import router as settings_router
from staffsync.modules.sites.router import router as sites_router
from staffsync.modules.uploads.router import router as uploads_router
from staffsync.modules.users_roles.router import router as users_roles_router
from staffsync.modules.webhooks.router import router as webhooks_router

api_router = APIRouter()
for r in (auth_router, companies_router, branches_router, sites_router, employees_router, users_roles_router, schedules_router, attendance_router, settings_router, uploads_router, alerts_router, corrections_router, leave_router, audit_router, notifications_router, dashboard_router, manager_router, billing_router, reports_router, webhooks_router, realtime_router, files_router, chat_router):
    api_router.include_router(r)

root_router = APIRouter()
root_router.include_router(health_router)
