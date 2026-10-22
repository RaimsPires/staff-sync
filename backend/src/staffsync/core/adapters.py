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


_notifier: Notifier | None = None


def get_notifier() -> Notifier:
    global _notifier
    if _notifier is None:
        # Real SMTP / SMS gateway / FCM adapters are selected here from settings once credentials exist.
        _notifier = ConsoleNotifier()
    return _notifier


async def notify(channel: str, to: str, body: str, *, subject: str | None = None, **data: Any) -> None:
    await get_notifier().send(Message(channel, to, subject, body, data))


# --- Object storage ---------------------------------------------------------------------------------


class Storage(Protocol):
    async def presign_put(self, key: str, content_type: str, max_bytes: int) -> dict[str, Any]: ...
    async def presign_get(self, key: str, expires_s: int = 300) -> str: ...


class LocalStorage:
    """Dev stand-in: returns URLs that look like presigned ones but nothing is stored."""

    async def presign_put(self, key: str, content_type: str, max_bytes: int) -> dict[str, Any]:
        return {"key": key, "url": f"http://localhost:9000/dev-bucket/{key}", "method": "PUT", "headers": {"Content-Type": content_type}, "max_bytes": max_bytes}

    async def presign_get(self, key: str, expires_s: int = 300) -> str:
        return f"http://localhost:9000/dev-bucket/{key}?expires={expires_s}"


class S3Storage:
    def __init__(self) -> None:
        import aioboto3

        self.s = get_settings()
        self.session = aioboto3.Session()

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


def get_storage() -> Storage:
    return S3Storage() if get_settings().s3_bucket else LocalStorage()
