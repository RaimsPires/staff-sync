"""Full export of a company's data as a ZIP of CSV files (data portability)."""

import csv
import io
import zipfile
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import select as sa_select
from sqlmodel import SQLModel

from staffsync.core.adapters import get_storage, notify
from staffsync.core.audit import audit
from staffsync.core.context import RequestContext
from staffsync.core.errors import RateLimited
from staffsync.core.i18n import gettext_, recipient_locale
from staffsync.core.mailing import EmailContent
from staffsync.core.redis import get_redis

TABLES = ["branches", "sites", "employees", "employee_sites", "attendance_records", "attendance_notes", "leave_types", "leave_balances", "leave_requests", "leave_approvals",
          "schedules", "shifts", "alerts", "correction_requests", "holidays", "audit_logs"]
SECRET_PARTS = ("hash", "secret", "token", "password", "backup", "pin")
DOWNLOAD_TTL_S = 3600


def _cell(v) -> str:
    if v is None:
        return ""
    if isinstance(v, (list, tuple, dict)):
        import json

        return json.dumps(v, default=str, ensure_ascii=False)
    return str(v)


async def build(ctx: RequestContext) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for name in TABLES:
            table = SQLModel.metadata.tables.get(name)
            if table is None:
                continue
            cols = [c for c in table.columns if not any(p in c.name for p in SECRET_PARTS) and c.type.__class__.__name__ not in ("Geometry", "Geography")]
            rows = (await ctx.session.execute(sa_select(*cols).where(table.c.company_id == ctx.company_id))).all()
            out = io.StringIO()
            w = csv.writer(out)
            w.writerow([c.name for c in cols])
            for r in rows:
                w.writerow([_cell(v) for v in r])
            z.writestr(f"{name}.csv", out.getvalue())
        # people: names live on the user row
        from staffsync.modules.auth.models import CompanyMember, User

        people = (await ctx.session.execute(sa_select(User.id, User.full_name, User.email, User.phone, User.locale).join(CompanyMember, CompanyMember.user_id == User.id).where(CompanyMember.company_id == ctx.company_id))).all()
        out = io.StringIO()
        w = csv.writer(out)
        w.writerow(["user_id", "full_name", "email", "phone", "locale"])
        w.writerows([[_cell(v) for v in r] for r in people])
        z.writestr("people.csv", out.getvalue())
        z.writestr("README.txt", f"StaffSync export of company {ctx.company_id}\nCreated {datetime.now(UTC):%Y-%m-%d %H:%M} UTC by {ctx.user.full_name}.\nSecrets (password hashes, tokens, PIN hashes) are never included.\n")
    return buf.getvalue()


async def export_company(ctx: RequestContext) -> dict:
    r = get_redis()
    if not await r.set(f"export:{ctx.company_id}", "1", ex=3600, nx=True):
        raise RateLimited("An export was already made in the last hour", code="EXPORT_RECENT", retry_after=await r.ttl(f"export:{ctx.company_id}"))
    key = f"exports/{ctx.company_id}/{uuid4().hex}.zip"
    storage = get_storage()
    await storage.put(key, await build(ctx), "application/zip")
    url = await storage.presign_get(key, DOWNLOAD_TTL_S)
    audit(ctx, "company.exported", "company", ctx.company_id)
    if ctx.user.email:
        lang = recipient_locale(ctx.user.locale)
        content = EmailContent(
            heading=gettext_("Your data export is ready", lang),
            paragraphs=[gettext_("The ZIP file with your company's data is ready to download.", lang)],
            button=(gettext_("Download the export", lang), url),
            note=gettext_("The link works for one hour.", lang),
        )
        await notify("email", ctx.user.email, gettext_("Your StaffSync data export is ready (the link works for one hour): %(link)s", lang, link=url), subject=gettext_("Your data export", lang), email=content, lang=lang, link=url)
    return {"status": "ready", "download_url": url, "expires_in": DOWNLOAD_TTL_S}

