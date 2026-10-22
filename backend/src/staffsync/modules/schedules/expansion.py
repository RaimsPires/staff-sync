"""Pure schedule -> shift expansion. No DB, no HTTP: local wall-clock times in the site's timezone become UTC instants.

Handles daylight saving (zoneinfo), night shifts that cross midnight, and rotation patterns.
"""

from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo


@dataclass(frozen=True)
class Rule:
    type: str  # recurring | intervention
    days_of_week: tuple[int, ...]  # 0 = Monday
    start_time: time
    end_time: time
    crosses_midnight: bool
    valid_from: date
    valid_to: date | None
    rotation: dict | None = None  # {"pattern": [{"weeks": 2, "start": "06:00", "end": "14:00", "crosses_midnight": false}, ...]}


@dataclass(frozen=True)
class Occurrence:
    starts_at: datetime  # UTC
    ends_at: datetime  # UTC
    local_date: date


def _parse(t: str) -> time:
    h, m = t.split(":")[:2]
    return time(int(h), int(m))


def local_to_utc(d: date, t: time, tz: ZoneInfo, plus_days: int = 0) -> datetime:
    naive = datetime.combine(d + timedelta(days=plus_days), t)
    return naive.replace(tzinfo=tz).astimezone(UTC)


def _week_start(d: date) -> date:
    return d - timedelta(days=d.weekday())


def _slot_for(rule: Rule, d: date) -> tuple[time, time, bool] | None:
    """Start/end/crosses for date d, honouring a rotation pattern (cycle of N-week blocks)."""
    if not rule.rotation or not rule.rotation.get("pattern"):
        return rule.start_time, rule.end_time, rule.crosses_midnight
    pattern = rule.rotation["pattern"]
    cycle = sum(int(p["weeks"]) for p in pattern)
    weeks_since = (_week_start(d) - _week_start(rule.valid_from)).days // 7
    pos = weeks_since % cycle
    for p in pattern:
        if pos < int(p["weeks"]):
            if p.get("off"):
                return None
            return _parse(p["start"]), _parse(p["end"]), bool(p.get("crosses_midnight", False))
        pos -= int(p["weeks"])
    return None


def expand(rule: Rule, tz: ZoneInfo, window_from: date, window_to: date) -> list[Occurrence]:
    """Occurrences whose local start date falls in [window_from, window_to] (inclusive)."""
    out: list[Occurrence] = []
    if rule.type == "intervention":
        days = [rule.valid_from] if window_from <= rule.valid_from <= window_to else []
    else:
        lo = max(rule.valid_from, window_from)
        hi = min(rule.valid_to, window_to) if rule.valid_to else window_to
        days = [lo + timedelta(days=i) for i in range((hi - lo).days + 1)] if hi >= lo else []
        days = [d for d in days if d.weekday() in rule.days_of_week]
    for d in days:
        slot = _slot_for(rule, d)
        if slot is None:
            continue
        start, end, crosses = slot
        crosses = crosses or end <= start  # a shift that ends "before" it starts must run past midnight
        out.append(Occurrence(local_to_utc(d, start, tz), local_to_utc(d, end, tz, 1 if crosses else 0), d))
    return out


def overlaps(a_start: datetime, a_end: datetime, b_start: datetime, b_end: datetime) -> bool:
    return a_start < b_end and b_start < a_end
