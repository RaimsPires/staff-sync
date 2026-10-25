"""Provider adapters (Adapter + Factory patterns): vendors can be swapped without touching services.

Dev/test implementations log and record messages in memory; production adapters plug in by settings.
"""

from dataclasses import dataclass, field
from typing import Any, Protocol

from staffsync.core.config import get_settings
from staffsync.core.logging import get_logger

log = get_logger("adapters")


@dataclass
class Message:
    channel: str  # email | sms | push
    to: str
    subject: str | None
    body: str
    data: dict[str, Any] = field(default_factory=dict)


class Notifier(Protocol):
    async def send(self, message: Message) -> None: ...


class ConsoleNotifier:
    """Logs instead of sending, and keeps messages in memory so tests and dev can read OTP codes."""

    sent: list[Message] = []

    async def send(self, message: Message) -> None:
        self.sent.append(message)
        if len(self.sent) > 500:
            del self.sent[:100]
        extra = {"body": message.body} if get_settings().app_env in ("dev", "test") else {}  # dev only: lets you read OTP codes
        log.info("notify", channel=message.channel, to=message.to, subject=message.subject, **extra)


class SmtpNotifier:
    """E-mail through any SMTP server (set SMTP_HOST and friends in the environment)."""

    def __init__(self) -> None:
        from fastapi_mail import ConnectionConfig, FastMail

        s = get_settings()
        self.mail = FastMail(
            ConnectionConfig(
                MAIL_USERNAME=s.smtp_username or "",
                MAIL_PASSWORD=s.smtp_password or "",  # type: ignore[arg-type]
                MAIL_FROM=s.smtp_from_email,
                MAIL_FROM_NAME=s.smtp_from_name,
                MAIL_SERVER=s.smtp_host or "",
                MAIL_PORT=s.smtp_port,
                MAIL_STARTTLS=s.smtp_starttls and not s.smtp_ssl,
                MAIL_SSL_TLS=s.smtp_ssl,
                USE_CREDENTIALS=bool(s.smtp_username),
                VALIDATE_CERTS=True,
            )
        )

    async def send(self, message: Message) -> None:
        import html
        import re

        from fastapi_mail import MessageSchema, MessageType

        linked = re.sub(r"(https?://[^\s<]+)", r'<a href="\1">\1</a>', html.escape(message.body)).replace("\n", "<br>")
        await self.mail.send_message(
            MessageSchema(subject=message.subject or "StaffSync", recipients=[message.to], body=f"<p style=\"font-family:sans-serif;font-size:15px\">{linked}</p>", subtype=MessageType.html)  # type: ignore[arg-type]
        )


class SmsGateway:
    """SMS through Twilio or Africa's Talking, picked by SMS_PROVIDER."""

    async def send(self, message: Message) -> None:
        import httpx

        s = get_settings()
        async with httpx.AsyncClient(timeout=15) as c:
            if s.sms_provider == "twilio":
                data = {"To": message.to, "Body": message.body}
                if s.twilio_messaging_service_sid:
                    data["MessagingServiceSid"] = s.twilio_messaging_service_sid
                else:
                    data["From"] = s.twilio_from or ""
                r = await c.post(f"https://api.twilio.com/2010-04-01/Accounts/{s.twilio_account_sid}/Messages.json", data=data, auth=(s.twilio_account_sid or "", s.twilio_auth_token or ""))
            else:
                host = "api.sandbox.africastalking.com" if s.africastalking_username == "sandbox" else "api.africastalking.com"
                data = {"username": s.africastalking_username or "", "to": message.to, "message": message.body}
                if s.africastalking_sender_id:
                    data["from"] = s.africastalking_sender_id
                r = await c.post(f"https://{host}/version1/messaging", data=data, headers={"apiKey": s.africastalking_api_key or "", "Accept": "application/json"})
            r.raise_for_status()


class ExpoPush:
    """Push notifications through Expo's service, which delivers to APNs and FCM. `to` is an Expo push token."""

    URL = "https://exp.host/--/api/v2/push/send"

    async def send(self, message: Message) -> None:
        import httpx

        s = get_settings()
        headers = {"Accept": "application/json", "Content-Type": "application/json"}
        if s.expo_access_token:
            headers["Authorization"] = f"Bearer {s.expo_access_token}"
        payload = {"to": message.to, "title": message.subject or "StaffSync", "body": message.body, "sound": "default", "data": message.data}
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(self.URL, json=payload, headers=headers)
            r.raise_for_status()
            result = r.json().get("data", {})
            if isinstance(result, dict) and result.get("status") == "error":
                raise RuntimeError(f"push rejected: {result.get('message')}")


class RoutingNotifier:
    """Always logs (and, in dev, keeps the message so codes can be read); then hands it to the real provider for the
    channel when one is configured. A provider failure is logged and never breaks the request that triggered it."""

    def __init__(self) -> None:
        s = get_settings()
        self.console = ConsoleNotifier()
        self.providers: dict[str, Notifier] = {}
        if s.smtp_host:
            self.providers["email"] = SmtpNotifier()
        if s.sms_provider == "twilio" and s.twilio_account_sid and (s.twilio_from or s.twilio_messaging_service_sid):
            self.providers["sms"] = SmsGateway()
        elif s.sms_provider == "africastalking" and s.africastalking_api_key:
            self.providers["sms"] = SmsGateway()
        if s.expo_push_enabled:
            self.providers["push"] = ExpoPush()

    async def send(self, message: Message) -> None:
        await self.console.send(message)
        provider = self.providers.get(message.channel)
        if provider is None:
            return
        try:
            await provider.send(message)
        except Exception as exc:  # delivery is best effort: the user can ask for a new code
            log.error("notify_failed", channel=message.channel, to=message.to, error=str(exc))


_notifier: Notifier | None = None


def get_notifier() -> Notifier:
    global _notifier
    if _notifier is None:
        _notifier = RoutingNotifier()
    return _notifier


async def notify(channel: str, to: str, body: str, *, subject: str | None = None, **data: Any) -> None:
    await get_notifier().send(Message(channel, to, subject, body, data))


# --- Object storage ---------------------------------------------------------------------------------


class Storage(Protocol):
    async def presign_put(self, key: str, content_type: str, max_bytes: int) -> dict[str, Any]: ...
    async def presign_get(self, key: str, expires_s: int = 300) -> str: ...
    async def put(self, key: str, data: bytes, content_type: str) -> None: ...
    async def get(self, key: str) -> bytes | None: ...
    async def delete(self, key: str) -> None: ...


def _safe_key(key: str) -> str:
    """Storage keys are slash-separated names we generate; refuse anything that could leave the storage folder."""
    import re

    if not re.fullmatch(r"[A-Za-z0-9_\-./]{1,300}", key) or ".." in key.split("/") or key.startswith("/"):
        raise ValueError("invalid storage key")
    return key


def _encode_capability(payload: dict[str, Any]) -> str:
    import base64
    import json

    from staffsync.core.security import sign_ticket

    raw = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode().rstrip("=")
    return sign_ticket("file", raw, int(payload["ttl"]))


def read_capability(token: str) -> dict[str, Any]:
    """The payload of a file URL token (raises Unauthenticated when forged or expired)."""
    import base64
    import json

    from staffsync.core.security import read_ticket

    raw = read_ticket("file", token)
    return json.loads(base64.urlsafe_b64decode(raw + "=" * (-len(raw) % 4)))


class LocalStorage:
    """Development storage on local disk. URLs point at this API (`/files/{token}`) and carry a signed, short-lived
    capability, so the phone and the dashboard upload and download exactly like they would with S3."""

    def __init__(self) -> None:
        from pathlib import Path

        self.root = Path(get_settings().local_storage_dir).resolve()

    def path(self, key: str):
        return self.root / _safe_key(key)

    def _url(self, payload: dict[str, Any]) -> str:
        s = get_settings()
        return f"{s.public_api_url.rstrip('/')}{s.api_prefix}/files/{_encode_capability(payload)}"

    async def presign_put(self, key: str, content_type: str, max_bytes: int) -> dict[str, Any]:
        _safe_key(key)
        url = self._url({"op": "put", "key": key, "ct": content_type, "max": max_bytes, "ttl": 600})
        return {"key": key, "url": url, "method": "PUT", "headers": {"Content-Type": content_type}, "max_bytes": max_bytes}

    async def presign_get(self, key: str, expires_s: int = 300) -> str:
        return self._url({"op": "get", "key": _safe_key(key), "ttl": expires_s})

    async def put(self, key: str, data: bytes, content_type: str) -> None:
        import asyncio

        target = self.path(key)

        def write() -> None:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)

        await asyncio.to_thread(write)

    async def get(self, key: str) -> bytes | None:
        import asyncio

        target = self.path(key)
        return await asyncio.to_thread(target.read_bytes) if target.is_file() else None

    async def delete(self, key: str) -> None:
        import asyncio

        await asyncio.to_thread(self.path(key).unlink, missing_ok=True)


class S3Storage:
    def __init__(self) -> None:
        import aioboto3

        self.s = get_settings()
        self.session = aioboto3.Session(
            aws_access_key_id=self.s.s3_access_key_id, aws_secret_access_key=self.s.s3_secret_access_key, region_name=self.s.s3_region
        )

    def _client(self):
        return self.session.client("s3", endpoint_url=self.s.s3_endpoint_url)

    async def presign_put(self, key: str, content_type: str, max_bytes: int) -> dict[str, Any]:
        async with self._client() as c:
            post = await c.generate_presigned_post(
                self.s.s3_bucket,
                key,
                Fields={"Content-Type": content_type},
                Conditions=[["content-length-range", 1, max_bytes], {"Content-Type": content_type}],
                ExpiresIn=300,
            )
        return {"key": key, "url": post["url"], "method": "POST", "fields": post["fields"], "max_bytes": max_bytes}

    async def presign_get(self, key: str, expires_s: int = 300) -> str:
        async with self._client() as c:
            return await c.generate_presigned_url("get_object", Params={"Bucket": self.s.s3_bucket, "Key": key}, ExpiresIn=expires_s)

    async def put(self, key: str, data: bytes, content_type: str) -> None:
        async with self._client() as c:
            await c.put_object(Bucket=self.s.s3_bucket, Key=key, Body=data, ContentType=content_type)

    async def delete(self, key: str) -> None:
        async with self._client() as c:
            await c.delete_object(Bucket=self.s.s3_bucket, Key=key)

    async def get(self, key: str) -> bytes | None:
        async with self._client() as c:
            try:
                obj = await c.get_object(Bucket=self.s.s3_bucket, Key=key)
            except c.exceptions.NoSuchKey:
                return None
            return await obj["Body"].read()


def get_storage() -> Storage:
    return S3Storage() if get_settings().s3_bucket else LocalStorage()
