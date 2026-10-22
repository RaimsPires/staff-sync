from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel, Field
from sqlmodel import select

from staffsync.common.enums import Perm
from staffsync.core.audit import audit
from staffsync.core.deps import require
from staffsync.core.errors import NotFound, ValidationFailed
from staffsync.modules.webhooks import service
from staffsync.modules.webhooks.models import Webhook, WebhookDelivery

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


class WebhookIn(BaseModel):
    url: str = Field(max_length=500)
    events: list[str] = Field(min_length=1)
    active: bool = True


class WebhookPatch(BaseModel):
    url: str | None = Field(default=None, max_length=500)
    events: list[str] | None = None
    active: bool | None = None


def _out(h: Webhook, secret: bool = False) -> dict:
    return {"id": h.id, "url": h.url, "events": h.events, "active": h.active, **({"secret": h.secret} if secret else {})}


def _check_events(events: list[str]) -> None:
    bad = set(events) - service.EVENTS
    if bad:
        raise ValidationFailed(f"Unknown event(s): {', '.join(sorted(bad))}")


async def _get(ctx, wid: UUID) -> Webhook:
    h = (await ctx.session.exec(select(Webhook).where(Webhook.id == wid, Webhook.company_id == ctx.company_id))).first()
    if h is None:
        raise NotFound()
    return h


@router.get("")
async def list_hooks(ctx=require(Perm.SETTINGS_MANAGE)):
    return [_out(h) for h in (await ctx.session.exec(select(Webhook).where(Webhook.company_id == ctx.company_id))).all()]


@router.get("/events")
async def events(ctx=require(Perm.SETTINGS_MANAGE)):
    return sorted(service.EVENTS)


@router.post("", status_code=201)
async def create(body: WebhookIn, ctx=require(Perm.SETTINGS_MANAGE)):
    service.validate_url(body.url)
    _check_events(body.events)
    h = Webhook(company_id=ctx.company_id, url=body.url, events=body.events, active=body.active, secret=service.new_secret())
    ctx.session.add(h)
    await ctx.session.flush()
    audit(ctx, "webhook.created", "webhook", h.id, after={"url": h.url, "events": h.events})
    return _out(h, secret=True)  # secret is shown once


@router.patch("/{webhook_id}")
async def patch(webhook_id: UUID, body: WebhookPatch, ctx=require(Perm.SETTINGS_MANAGE)):
    h = await _get(ctx, webhook_id)
    data = body.model_dump(exclude_unset=True)
    if "url" in data:
        service.validate_url(data["url"])
    if "events" in data:
        _check_events(data["events"])
    for k, v in data.items():
        setattr(h, k, v)
    audit(ctx, "webhook.updated", "webhook", h.id, after=data)
    return _out(h)


@router.delete("/{webhook_id}", status_code=204)
async def delete(webhook_id: UUID, ctx=require(Perm.SETTINGS_MANAGE)):
    h = await _get(ctx, webhook_id)
    await ctx.session.delete(h)
    audit(ctx, "webhook.deleted", "webhook", h.id)


@router.get("/{webhook_id}/deliveries")
async def deliveries(webhook_id: UUID, ctx=require(Perm.SETTINGS_MANAGE)):
    h = await _get(ctx, webhook_id)
    rows = (await ctx.session.exec(select(WebhookDelivery).where(WebhookDelivery.webhook_id == h.id).order_by(WebhookDelivery.created_at.desc()).limit(100))).all()  # type: ignore[attr-defined]
    return [{"id": d.id, "event": d.event_type, "status": d.status, "attempts": d.attempts, "response_code": d.response_code, "created_at": d.created_at} for d in rows]


@router.post("/{webhook_id}/deliveries/{delivery_id}/retry", status_code=202)
async def retry(webhook_id: UUID, delivery_id: UUID, ctx=require(Perm.SETTINGS_MANAGE)):
    from datetime import UTC, datetime

    d = (await ctx.session.exec(select(WebhookDelivery).where(WebhookDelivery.id == delivery_id, WebhookDelivery.webhook_id == webhook_id, WebhookDelivery.company_id == ctx.company_id))).first()
    if d is None:
        raise NotFound()
    d.status, d.attempts, d.next_attempt_at = "pending", 0, datetime.now(UTC)
    return {"status": "queued"}
