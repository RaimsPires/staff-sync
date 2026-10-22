import hashlib
import hmac
import ipaddress
import json
import secrets
import socket
import time
from datetime import UTC, datetime, timedelta
from urllib.parse import urlparse

import httpx
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from staffsync.core.config import get_settings
from staffsync.core.errors import ValidationFailed
from staffsync.modules.webhooks.models import Webhook, WebhookDelivery

EVENTS = {"attendance.checked_in", "attendance.checked_out", "attendance.flagged", "leave.requested", "leave.approved", "employee.created", "employee.deactivated"}
MAX_ATTEMPTS = 6


def validate_url(url: str) -> None:
    """Block SSRF: https only (http allowed in dev), and never private/loopback/link-local targets."""
    u = urlparse(url)
    if u.scheme not in ("https", "http") or not u.hostname or (u.scheme == "http" and get_settings().is_prod):
        raise ValidationFailed("Webhook URL must be https", code="INVALID_URL")
    if get_settings().app_env in ("dev", "test"):
        return
    try:
        infos = socket.getaddrinfo(u.hostname, u.port or 443, proto=socket.IPPROTO_TCP)
    except socket.gaierror as exc:
        raise ValidationFailed("Webhook host cannot be resolved", code="INVALID_URL") from exc
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            raise ValidationFailed("Webhook URL points to a private address", code="INVALID_URL")


def new_secret() -> str:
    return "whsec_" + secrets.token_urlsafe(32)


def sign(secret: str, timestamp: int, body: str) -> str:
    return hmac.new(secret.encode(), f"{timestamp}.{body}".encode(), hashlib.sha256).hexdigest()


async def enqueue(session: AsyncSession, company_id, event_type: str, payload: dict) -> int:
    hooks = (await session.exec(select(Webhook).where(Webhook.company_id == company_id, Webhook.active.is_(True)))).all()  # type: ignore[attr-defined]
    n = 0
    for h in hooks:
        if event_type in h.events:
            session.add(WebhookDelivery(company_id=company_id, webhook_id=h.id, event_type=event_type, payload=json.dumps({"type": event_type, "data": payload, "created": int(time.time())}), next_attempt_at=datetime.now(UTC)))
            n += 1
    return n


async def deliver(session: AsyncSession, d: WebhookDelivery, client: httpx.AsyncClient | None = None) -> None:
    hook = await session.get(Webhook, d.webhook_id)
    if hook is None or not hook.active:
        d.status = "failed"
        return
    ts = int(time.time())
    d.attempts += 1
    try:
        validate_url(hook.url)
        c = client or httpx.AsyncClient(timeout=10, follow_redirects=False)
        resp = await c.post(hook.url, content=d.payload, headers={"Content-Type": "application/json", "X-StaffSync-Signature": f"t={ts},v1={sign(hook.secret, ts, d.payload)}"})
        d.response_code = resp.status_code
        ok = 200 <= resp.status_code < 300
    except Exception:
        ok = False
    if ok:
        d.status, d.next_attempt_at = "delivered", None
    elif d.attempts >= MAX_ATTEMPTS:
        d.status, d.next_attempt_at = "failed", None
    else:
        d.next_attempt_at = datetime.now(UTC) + timedelta(seconds=30 * 2 ** d.attempts)  # exponential backoff
