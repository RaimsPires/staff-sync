"""Cursor pagination over a (timestamp, id) key."""

import base64
import json
from datetime import datetime
from typing import Any
from uuid import UUID

from staffsync.core.errors import ValidationFailed


def encode_cursor(ts: datetime, id_: UUID) -> str:
    return base64.urlsafe_b64encode(json.dumps([ts.isoformat(), str(id_)]).encode()).decode()


def decode_cursor(cursor: str | None) -> tuple[datetime, UUID] | None:
    if not cursor:
        return None
    try:
        ts, id_ = json.loads(base64.urlsafe_b64decode(cursor.encode()))
        return datetime.fromisoformat(ts), UUID(id_)
    except Exception as exc:
        raise ValidationFailed("Invalid cursor") from exc


def csv_param(value: str | None) -> list[str]:
    return [v for v in (value or "").split(",") if v]


def clamp_limit(limit: int, maximum: int = 200) -> int:
    return max(1, min(limit, maximum))


def build_page(rows: list[Any], limit: int, key) -> tuple[list[Any], str | None]:
    """`rows` must have been fetched with limit+1; key(row) -> (timestamp, id)."""
    if len(rows) > limit:
        rows = rows[:limit]
        ts, id_ = key(rows[-1])
        return rows, encode_cursor(ts, id_)
    return rows, None
