from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import func
from sqlmodel import select

from staffsync.core.adapters import get_storage
from staffsync.core.audit import audit
from staffsync.core.context import RequestContext
from staffsync.core.errors import Forbidden, NotFound, ValidationFailed
from staffsync.modules.branches.models import Branch
from staffsync.modules.companies.models import Company
from staffsync.modules.companies.schemas import CompanyRead, CompanyUpdate
from staffsync.modules.employees.models import Employee
from staffsync.modules.schedules.models import Schedule
from staffsync.modules.sites.models import Site


async def get_company(ctx: RequestContext) -> Company:
    company = await ctx.session.get(Company, ctx.company_id)
    if company is None:
        raise NotFound()
    return company


async def read_company(ctx: RequestContext, company: Company) -> CompanyRead:
    logo = await get_storage().presign_get(company.logo_key) if company.logo_key else None
    return CompanyRead(**company.model_dump(include=set(CompanyRead.model_fields) - {"logo_url"}), logo_url=logo)


async def update_company(ctx: RequestContext, body: CompanyUpdate) -> Company:
    company = await get_company(ctx)
    data = body.model_dump(exclude_unset=True)
    if "timezone" in data:
        try:
            ZoneInfo(data["timezone"])
        except ZoneInfoNotFoundError as exc:
            raise ValidationFailed("Unknown timezone") from exc
    before = company.model_dump(include=set(data))
    for k, v in data.items():
        setattr(company, k, v)
    ctx.session.add(company)
    audit(ctx, "company.updated", "company", company.id, before=before, after=data)
    return company


async def logo_upload(ctx: RequestContext, content_type: str, size: int) -> dict:
    ext = content_type.split("/")[1]
    key = f"companies/{ctx.company_id}/logo.{ext}"
    company = await get_company(ctx)
    company.logo_key = key
    ctx.session.add(company)
    return await get_storage().presign_put(key, content_type, size)


async def onboarding(ctx: RequestContext) -> dict:
    company = await get_company(ctx)

    async def count(model) -> int:
        return (await ctx.session.exec(select(func.count()).select_from(model).where(model.company_id == ctx.company_id))).one()

    branches, sites, employees, schedules = await count(Branch), await count(Site), await count(Employee), await count(Schedule)
    items = [
        {"key": "branch", "done": branches > 0},
        {"key": "site", "done": sites > 0},
        {"key": "employees", "done": employees > 0},
        {"key": "schedule", "done": schedules > 0},
        {"key": "app", "done": False, "hint": "Download the mobile app"},
    ]
    return {"step": company.onboarding_step, "done": company.onboarding_done, "checklist": items, "empty": branches == 0 and sites == 0 and employees == 0}


async def schedule_deletion(ctx: RequestContext, confirm_name: str, grace_days: int = 30) -> datetime:
    company = await get_company(ctx)
    if confirm_name.strip() != company.name:
        raise ValidationFailed("Typed company name does not match", code="CONFIRMATION_MISMATCH")
    if "Super admin" not in ctx.role_names:
        raise Forbidden("Only the owner can delete the company")
    company.status = "pending_deletion"
    company.deletion_scheduled_at = datetime.now(UTC) + timedelta(days=grace_days)
    ctx.session.add(company)
    audit(ctx, "company.deletion_scheduled", "company", company.id)
    return company.deletion_scheduled_at
