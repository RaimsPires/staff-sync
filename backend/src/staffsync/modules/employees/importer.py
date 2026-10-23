"""CSV import: upload -> preview with row errors -> commit. Job state lives in Redis for one hour."""

import csv
import io
import json
from uuid import UUID, uuid4

from sqlmodel import select

from staffsync.core.context import RequestContext
from staffsync.core.errors import AppError, NotFound, ValidationFailed
from staffsync.core.i18n import code_message, error_message
from staffsync.core.logging import get_logger
from staffsync.core.redis import get_redis
from staffsync.modules.branches.models import Branch
from staffsync.modules.employees import service
from staffsync.modules.employees.schemas import EmployeeCreate
from staffsync.modules.sites.models import Site

FIELDS = ["full_name", "employee_no", "email", "phone", "branch_code", "job_title", "start_date", "has_smartphone", "site_codes"]
TEMPLATE = ",".join(FIELDS) + "\nJane Doe,E-1001,jane@example.com,+237670000000,HQ,Cashier,2026-01-05,true,SITE-A;SITE-B\n"
MAX_ROWS = 2000
TTL = 3600


def _row_message(row: int, exc: Exception) -> str:
    """Localized per-row reason; raw exception text (pydantic, SQL) is logged, never returned."""
    if isinstance(exc, AppError):
        return error_message(exc.code, exc.status, exc.detail, exc.extra)
    get_logger().info("import_row_failed", row=row, error=str(exc)[:200])
    return code_message("ROW_INVALID") or ""


def _key(ctx: RequestContext, job_id: UUID) -> str:
    return f"import:{ctx.company_id}:{job_id}"


async def start(ctx: RequestContext, content: bytes) -> dict:
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ValidationFailed("File must be UTF-8 encoded CSV") from exc
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise ValidationFailed("The file has no header row")
    rows = [dict(r) for _, r in zip(range(MAX_ROWS + 1), reader)]
    if len(rows) > MAX_ROWS:
        raise ValidationFailed(f"At most {MAX_ROWS} rows per import", code="TOO_MANY_ROWS", max_rows=MAX_ROWS)
    headers = list(reader.fieldnames)
    mapping = {f: (f if f in headers else None) for f in FIELDS}
    job_id = uuid4()
    await get_redis().set(_key(ctx, job_id), json.dumps({"headers": headers, "rows": rows, "mapping": mapping, "status": "uploaded"}), ex=TTL)
    return await preview(ctx, job_id)


async def _load(ctx: RequestContext, job_id: UUID) -> dict:
    raw = await get_redis().get(_key(ctx, job_id))
    if not raw:
        raise NotFound("Import job not found or expired")
    return json.loads(raw)


def _val(row: dict, mapping: dict, field: str) -> str | None:
    col = mapping.get(field)
    v = (row.get(col) if col else None)
    v = v.strip() if isinstance(v, str) else v
    return v or None


async def _to_create(ctx: RequestContext, row: dict, mapping: dict, branches: dict[str, Branch], sites: dict[str, Site]) -> EmployeeCreate:
    code = _val(row, mapping, "branch_code")
    branch = branches.get((code or "").lower())
    if branch is None:
        raise ValueError(f"Unknown branch code '{code}'")
    site_ids = []
    for c in (_val(row, mapping, "site_codes") or "").replace(",", ";").split(";"):
        if c.strip():
            site = sites.get(c.strip().lower())
            if site is None:
                raise ValueError(f"Unknown site code '{c.strip()}'")
            site_ids.append(site.id)
    smartphone = (_val(row, mapping, "has_smartphone") or "true").lower() not in ("false", "no", "0")
    return EmployeeCreate(
        full_name=_val(row, mapping, "full_name") or "", employee_no=_val(row, mapping, "employee_no") or "", email=_val(row, mapping, "email"),
        phone=_val(row, mapping, "phone"), branch_id=branch.id, job_title=_val(row, mapping, "job_title"), start_date=_val(row, mapping, "start_date"),
        has_smartphone=smartphone, site_ids=site_ids, send_invite=False,
    )


async def _lookups(ctx: RequestContext):
    branches = {b.code.lower(): b for b in (await ctx.session.exec(select(Branch).where(Branch.company_id == ctx.company_id))).all()}
    sites = {s.code.lower(): s for s in (await ctx.session.exec(select(Site).where(Site.company_id == ctx.company_id))).all()}
    return branches, sites


async def preview(ctx: RequestContext, job_id: UUID, mapping: dict | None = None) -> dict:
    job = await _load(ctx, job_id)
    if mapping:
        job["mapping"] = {f: mapping.get(f) for f in FIELDS}
        await get_redis().set(_key(ctx, job_id), json.dumps(job), ex=TTL)
    branches, sites = await _lookups(ctx)
    errors, seen = [], set()
    for i, row in enumerate(job["rows"], start=2):  # +header line
        try:
            c = await _to_create(ctx, row, job["mapping"], branches, sites)
            if not c.email and not c.phone:
                raise ValidationFailed("Email or phone required", code="CONTACT_REQUIRED")
            if c.employee_no in seen:
                raise ValidationFailed("Duplicate employee number in file", code="DUPLICATE_EMPLOYEE_NO")
            seen.add(c.employee_no)
        except Exception as exc:  # pydantic ValidationError or AppError: report the row
            errors.append({"row": i, "error": _row_message(i, exc)})
    return {"job_id": job_id, "headers": job["headers"], "mapping": job["mapping"], "total": len(job["rows"]), "sample": job["rows"][:5], "errors": errors, "status": job["status"]}


async def commit(ctx: RequestContext, job_id: UUID) -> dict:
    job = await _load(ctx, job_id)
    branches, sites = await _lookups(ctx)
    created = skipped = 0
    failed: list[dict] = []
    for i, row in enumerate(job["rows"], start=2):
        try:
            body = await _to_create(ctx, row, job["mapping"], branches, sites)
            async with ctx.session.begin_nested():  # one bad row must not abort the others
                await service.create(ctx, body)
            created += 1
        except Exception as exc:
            if isinstance(exc, AppError) and "already" in (exc.detail or "").lower():
                skipped += 1
                continue
            failed.append({"row": i, "error": _row_message(i, exc)})
    job["status"] = "done"
    await get_redis().set(_key(ctx, job_id), json.dumps(job), ex=TTL)
    return {"job_id": job_id, "created": created, "skipped": skipped, "failed": failed}
