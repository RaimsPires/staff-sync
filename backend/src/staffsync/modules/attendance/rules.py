"""Pure attendance rules: status from times. Unit-tested without DB or HTTP."""

from dataclasses import dataclass
from datetime import datetime, timedelta


@dataclass(frozen=True)
class InResult:
    status: str  # on_time | late
    late_min: int


@dataclass(frozen=True)
class OutResult:
    status: str | None  # early_leave | overtime | None (keep the check-in status)
    early_min: int
    overtime_min: int
    worked_min: int


def check_in_result(shift_start: datetime | None, grace_min: int, at: datetime) -> InResult:
    if shift_start is None:
        return InResult("on_time", 0)
    if at <= shift_start + timedelta(minutes=grace_min):
        return InResult("on_time", 0)
    return InResult("late", max(1, int((at - shift_start).total_seconds() // 60)))


def check_out_result(
    shift_end: datetime | None, tol_min: int, overtime_threshold_min: int, check_in_at: datetime, at: datetime, break_min: int = 0
) -> OutResult:
    worked = max(0, int((at - check_in_at).total_seconds() // 60) - break_min)
    if shift_end is None:
        return OutResult(None, 0, 0, worked)
    if at < shift_end - timedelta(minutes=tol_min):
        return OutResult("early_leave", int((shift_end - at).total_seconds() // 60), 0, worked)
    over = int((at - shift_end).total_seconds() // 60)
    if over >= overtime_threshold_min:
        return OutResult("overtime", 0, over, worked)
    return OutResult(None, 0, 0, worked)
