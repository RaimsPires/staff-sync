from typing import Annotated, Literal

from fastapi import APIRouter, Header, Request
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlmodel import select

from staffsync.common.enums import Perm
from staffsync.core.deps import Ctx, PublicSession, require
from staffsync.modules.billing import service
from staffsync.modules.companies.service import get_company
from staffsync.modules.employees.models import Employee

router = APIRouter(prefix="/billing", tags=["billing"])


class CheckoutIn(BaseModel):
    plan: Literal["starter", "growth", "scale"]
    interval: Literal["month", "year"] = "month"
    seats: int = Field(default=10, ge=1, le=10_000)


@router.get("/plans")
async def plans(ctx: Ctx):
    from staffsync.core.config import get_settings

    prices = get_settings().stripe_prices
    return [{"key": k, **v, "intervals": [i for i in ("month", "year") if f"{k}_{i}" in prices]} for k, v in service.PLANS.items()]


@router.get("")
async def billing(ctx=require(Perm.BILLING_MANAGE)):
    c = await get_company(ctx)
    used = (await ctx.session.exec(select(func.count()).select_from(Employee).where(Employee.company_id == ctx.company_id, Employee.status != "deactivated"))).one()
    return {"plan": c.plan, "status": c.status, "subscription_status": c.subscription_status, "seat_limit": c.seat_limit, "seats_used": used, "trial_ends_at": c.trial_ends_at,
            "current_period_end": c.current_period_end, "has_billing_account": bool(c.stripe_customer_id)}


@router.post("/checkout")
async def checkout(body: CheckoutIn, ctx=require(Perm.BILLING_MANAGE)):
    c = await get_company(ctx)
    url = await service.checkout(c, ctx.user.email, body.plan, body.interval, body.seats)
    ctx.session.add(c)
    return {"url": url}


@router.post("/portal")
async def portal(ctx=require(Perm.BILLING_MANAGE)):
    return {"url": await service.portal(await get_company(ctx))}


@router.get("/invoices")
async def invoices(ctx=require(Perm.BILLING_MANAGE)):
    return await service.invoices(await get_company(ctx))


@router.post("/webhook", include_in_schema=False)
async def webhook(request: Request, session: PublicSession, stripe_signature: Annotated[str | None, Header()] = None):
    event = service.verify_event(await request.body(), stripe_signature)
    fresh = await service.record_and_process(session, event)
    return {"received": True, "duplicate": not fresh}
