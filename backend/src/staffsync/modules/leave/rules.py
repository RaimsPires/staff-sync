"""Pure leave rules: day counting and the request state machine."""

from datetime import date, timedelta

from staffsync.core.errors import Conflict

# status -> actions allowed from it -> resulting status
TRANSITIONS: dict[str, dict[str, str]] = {
    "pending": {"recommend": "recommended", "approve": "approved", "reject": "rejected", "request_changes": "changes_requested", "cancel": "cancelled"},
    "recommended": {"approve": "approved", "reject": "rejected", "request_changes": "changes_requested", "cancel": "cancelled"},
    "changes_requested": {"resubmit": "pending", "cancel": "cancelled"},
    "approved": {"request_cancellation": "cancellation_requested", "cancel_approved": "cancelled"},
    "cancellation_requested": {"cancel_approved": "cancelled", "reject_cancellation": "approved"},
    "rejected": {},
    "cancelled": {},
}


def next_status(current: str, action: str, *, levels: int = 1) -> str:
    if action == "approve" and levels == 2 and current == "pending":
        raise Conflict("Two-level approval: the site manager must recommend first", code="RECOMMENDATION_REQUIRED")
    if action == "recommend" and levels == 1:
        # One-level approval has no recommend step, but a site manager can still give an opinion: the request
        # stays pending for the approver, with the recommendation attached.
        if current != "pending":
            raise Conflict(f"Cannot recommend a {current.replace('_', ' ')} request", code="INVALID_TRANSITION")
        return "pending"
    try:
        return TRANSITIONS[current][action]
    except KeyError:
        raise Conflict(f"Cannot {action.replace('_', ' ')} a {current.replace('_', ' ')} request", code="INVALID_TRANSITION") from None


def count_days(start: date, end: date, start_half: str | None, end_half: str | None, holidays: set[date], *, half_days_allowed: bool = True) -> float:
    """Working days (Mon-Fri, minus public holidays). A half day on the first/last day counts 0.5."""
    if end < start:
        return 0.0
    total, d = 0.0, start
    while d <= end:
        if d.weekday() < 5 and d not in holidays:
            total += 1
        d += timedelta(days=1)
    if half_days_allowed:
        for day, half in ((start, start_half), (end, end_half)):
            if half and day.weekday() < 5 and day not in holidays:
                total -= 0.5
        if start == end and start_half and end_half and start_half != end_half:
            total = max(total, 0.0)  # morning + afternoon on the same day = a full day
    return max(total, 0.0)
