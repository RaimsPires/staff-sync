"""Stripe billing. Stripe is the source of truth: company plan/status change only from verified webhook events."""

from datetime import UTC, datetime, timedelta
from typing import Any

import stripe
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from staffsync.core.adapters import notify
from staffsync.core.config import get_settings
from staffsync.core.errors import AppError, ValidationFailed
from staffsync.core.i18n import gettext_, recipient_locale
from staffsync.core.logging import get_logger
from staffsync.modules.auth.models import CompanyMember, User
from staffsync.modules.billing.models import StripeEvent
from staffsync.modules.companies.models import Company

log = get_logger("billing")

PLANS = {
    "starter": {"name": "Starter", "seat_limit": 25, "features": ["attendance", "leave"]},
    "growth": {"name": "Growth", "seat_limit": 100, "features": ["attendance", "leave", "reports", "webhooks"]},
    "scale": {"name": "Scale", "seat_limit": 1000, "features": ["attendance", "leave", "reports", "webhooks", "sso"]},
}


class BillingNotConfigured(AppError):
    status, code, title = 503, "BILLING_NOT_CONFIGURED", "Billing is not configured"


def _client() -> None:
    key = get_settings().stripe_secret_key
    if not key:
        raise BillingNotConfigured("Stripe is not configured on this server")
    stripe.api_key = key


async def ensure_customer(company: Company, email: str | None) -> str:
    _client()
    if company.stripe_customer_id:
        return company.stripe_customer_id
    cust = await stripe.Customer.create_async(name=company.name, email=email, metadata={"company_id": str(company.id)}, idempotency_key=f"cust-{company.id}")
    company.stripe_customer_id = cust.id
    return cust.id


async def checkout(company: Company, owner_email: str | None, plan: str, interval: str, seats: int) -> str:
    if plan not in PLANS or interval not in ("month", "year"):
        raise ValidationFailed("Unknown plan or interval")
    price = get_settings().stripe_prices.get(f"{plan}_{interval}")
    if not price:
        raise ValidationFailed("This plan is not available yet", code="PRICE_NOT_CONFIGURED")
    customer = await ensure_customer(company, owner_email)
    base = get_settings().dashboard_url
    session = await stripe.checkout.Session.create_async(
        mode="subscription", customer=customer, client_reference_id=str(company.id), line_items=[{"price": price, "quantity": seats}],
        subscription_data={"metadata": {"company_id": str(company.id), "plan": plan}, **({"trial_period_days": 30} if not company.stripe_subscription_id and company.plan == "trial" else {})},
        success_url=f"{base}/settings/plans?checkout=success", cancel_url=f"{base}/settings/plans?checkout=cancelled", idempotency_key=f"co-{company.id}-{plan}-{interval}-{seats}-{datetime.now(UTC):%Y%m%d%H}",
    )
    return session.url


async def portal(company: Company) -> str:
    _client()
    if not company.stripe_customer_id:
        raise ValidationFailed("No billing account yet", code="NO_CUSTOMER")
    s = await stripe.billing_portal.Session.create_async(customer=company.stripe_customer_id, return_url=f"{get_settings().dashboard_url}/settings/plans")
    return s.url


async def invoices(company: Company) -> list[dict]:
    _client()
    if not company.stripe_customer_id:
        return []
    res = await stripe.Invoice.list_async(customer=company.stripe_customer_id, limit=24)
    return [{"id": i.id, "number": i.number, "status": i.status, "amount_due": i.amount_due, "currency": i.currency, "created": i.created, "pdf": i.invoice_pdf, "url": i.hosted_invoice_url} for i in res.data]


async def sync_seats(session: AsyncSession, company: Company, used: int) -> None:
    """Update the subscription quantity (with proration) when employees are added or deactivated."""
    if not company.stripe_subscription_id or not get_settings().stripe_secret_key:
        return
    _client()
    sub = await stripe.Subscription.retrieve_async(company.stripe_subscription_id)
    item = sub["items"]["data"][0]
    if item["quantity"] != max(used, 1):
        await stripe.Subscription.modify_async(sub.id, items=[{"id": item["id"], "quantity": max(used, 1)}], proration_behavior="create_prorations",
                                               idempotency_key=f"seats-{sub.id}-{used}")


# --- webhooks ---------------------------------------------------------------------------------------------


def verify_event(payload: bytes, signature: str | None) -> Any:
    secret = get_settings().stripe_webhook_secret
    if not secret:
        raise BillingNotConfigured("Webhook secret is not configured")
    try:
        return stripe.Webhook.construct_event(payload, signature or "", secret).to_dict()
    except (stripe.SignatureVerificationError, ValueError) as exc:
        raise ValidationFailed("Invalid signature", code="INVALID_SIGNATURE") from exc


async def _company_for(session: AsyncSession, obj: dict) -> Company | None:
    cid = (obj.get("metadata") or {}).get("company_id") or obj.get("client_reference_id")
    if cid:
        try:
            from uuid import UUID

            c = await session.get(Company, UUID(cid))
            if c:
                return c
        except ValueError:
            pass
    if obj.get("customer"):
        return (await session.exec(select(Company).where(Company.stripe_customer_id == obj["customer"]))).first()
    return None


async def _owner_emails(session: AsyncSession, company: Company) -> list[str]:
    rows = (await session.exec(select(User.email).join(CompanyMember, CompanyMember.user_id == User.id).where(CompanyMember.company_id == company.id, CompanyMember.is_owner.is_(True)))).all()  # type: ignore[attr-defined]
    return [e for e in rows if e]


async def record_and_process(session: AsyncSession, event: Any) -> bool:
    """Store the event id (unique) and apply it once. Returns False for a duplicate."""
    session.add(StripeEvent(id=event["id"], type=event["type"]))
    try:
        async with session.begin_nested():
            await session.flush()
    except IntegrityError:
        return False
    await apply_event(session, event)
    row = await session.get(StripeEvent, event["id"])
    if row:
        row.processed_at = datetime.now(UTC)
    return True


async def apply_event(session: AsyncSession, event: Any) -> None:
    t, obj = event["type"], event["data"]["object"]
    company = await _company_for(session, obj)
    if company is None:
        log.warning("stripe_event_without_company", type=t)
        return
    if t == "checkout.session.completed":
        company.stripe_customer_id = obj.get("customer") or company.stripe_customer_id
        company.stripe_subscription_id = obj.get("subscription") or company.stripe_subscription_id
    elif t in ("customer.subscription.created", "customer.subscription.updated"):
        company.stripe_subscription_id = obj["id"]
        company.subscription_status = obj["status"]
        company.plan = (obj.get("metadata") or {}).get("plan", company.plan)
        item = (obj.get("items") or {}).get("data", [{}])[0]
        if item.get("quantity"):
            company.seat_limit = item["quantity"]
        if obj.get("current_period_end"):
            company.current_period_end = datetime.fromtimestamp(obj["current_period_end"], UTC)
        if obj["status"] in ("active", "trialing"):
            company.status = "active"
    elif t == "customer.subscription.deleted":
        company.subscription_status = "canceled"
        company.status = "read_only"
    elif t == "invoice.paid":
        company.subscription_status = "active"
        company.status = "active"
    elif t == "invoice.payment_failed":
        company.subscription_status = "past_due"
        # the worker flips the company to read-only once the grace period has passed
        lang = recipient_locale(None, company.locale)
        for e in await _owner_emails(session, company):
            await notify("email", e, gettext_("Your last payment failed. Update your payment method to keep editing in StaffSync.", lang), subject=gettext_("Payment failed", lang))
    elif t == "customer.subscription.trial_will_end":
        lang = recipient_locale(None, company.locale)
        for e in await _owner_emails(session, company):
            await notify("email", e, gettext_("Your StaffSync trial ends in 3 days.", lang), subject=gettext_("Trial ending soon", lang))
    session.add(company)


async def enforce_grace(session: AsyncSession) -> int:
    """Worker job: past-due companies become read-only after the grace period."""
    cutoff = datetime.now(UTC) - timedelta(days=get_settings().billing_grace_days)
    rows = (await session.exec(select(Company).where(Company.subscription_status == "past_due", Company.status == "active", Company.updated_at < cutoff))).all()
    for c in rows:
        c.status = "read_only"
    return len(rows)
