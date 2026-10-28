"""Scheduled reports: a saved report with a schedule is built each week or month and e-mailed as a download link."""

from datetime import UTC, date, datetime, timedelta
from uuid import uuid4

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from staffsync.core.adapters import get_storage, notify
from staffsync.core.context import RequestContext
from staffsync.core.i18n import gettext_, recipient_locale
from staffsync.core.logging import get_logger
from staffsync.core.mailing import EmailContent
from staffsync.modules.auth.models import User
from staffsync.modules.reports import service
from staffsync.modules.reports.models import SavedReport
from staffsync.modules.users_roles.scope import resolve_access

log = get_logger("reports")
LINK_TTL_S = 7 * 86400


def period(frequency: str, today: date) -> tuple[date, date, date] | None:
    """-> (first day of the current period, first day of the reported period, last day of the reported period)."""
    if frequency == "weekly":
        this_monday = today - timedelta(days=today.weekday())
        return this_monday, this_monday - timedelta(days=7), this_monday - timedelta(days=1)
    if frequency == "monthly":
        first = today.replace(day=1)
        last_month_end = first - timedelta(days=1)
        return first, last_month_end.replace(day=1), last_month_end
    return None


async def run_due(session: AsyncSession, today: date | None = None) -> int:
    """Send every scheduled report whose period has started and that has not been sent for it yet. Returns how many."""
    today = today or datetime.now(UTC).date()
    sent = 0
    for rep in (await session.exec(select(SavedReport).where(SavedReport.schedule.is_not(None)))).all():  # type: ignore[union-attr]
        sched = rep.schedule or {}
        span = period(str(sched.get("frequency")), today)
        recipients = [r for r in sched.get("recipients", []) if isinstance(r, str) and "@" in r]
        if span is None or not recipients:
            continue
        current_start, d1, d2 = span
        if sched.get("last_run") and sched["last_run"] >= current_start.isoformat():
            continue
        try:
            await _send_one(session, rep, sched, recipients, d1, d2)
            rep.schedule = {**sched, "last_run": today.isoformat()}
            session.add(rep)
            sent += 1
        except Exception as exc:  # one broken report must not stop the others; it is tried again next run
            log.error("scheduled_report_failed", report=str(rep.id), error=str(exc))
    return sent


async def _send_one(session: AsyncSession, rep: SavedReport, sched: dict, recipients: list[str], d1: date, d2: date) -> None:
    owner = await session.get(User, rep.owner_user_id)
    perms, scope, role_names, employee_id = await resolve_access(session, rep.company_id, rep.owner_user_id)
    ctx = RequestContext(session=session, user=owner, company_id=rep.company_id, session_id=uuid4(), perms=perms, scope=scope, employee_id=employee_id, role_names=role_names)  # type: ignore[arg-type]
    d = rep.definition
    report = await service.build(ctx, d["type"], d1, d2, d.get("group_by", "employee"), d.get("site_ids"), d.get("columns"), d.get("branch_ids"), d.get("employee_ids"))
    fmt = sched.get("format", "csv")
    data, media = await service.file_for(ctx, report, fmt)
    key = f"reports/{rep.company_id}/{uuid4().hex}.{fmt}"
    storage = get_storage()
    await storage.put(key, data, media)
    link = await storage.presign_get(key, LINK_TTL_S)
    for to in recipients:
        lang = recipient_locale(owner.locale if owner else "en")
        body = gettext_("Your scheduled report %(name)s for %(start)s to %(end)s is ready (the link works for 7 days): %(link)s", lang, name=rep.name, start=d1.isoformat(), end=d2.isoformat(), link=link)
        content = EmailContent(
            heading=gettext_("Scheduled report: %(name)s", lang, name=rep.name),
            paragraphs=[gettext_("Your scheduled report for %(start)s to %(end)s is ready.", lang, start=d1.isoformat(), end=d2.isoformat())],
            button=(gettext_("Download the report", lang), link),
            note=gettext_("The link works for 7 days.", lang),
        )
        await notify("email", to, body, subject=gettext_("Scheduled report: %(name)s", lang, name=rep.name), email=content, lang=lang, link=link)
