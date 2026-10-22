"""Pure unit tests: no database, no HTTP."""

from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

import pytest

from staffsync.common.geo import circle_polygon, haversine_m, validate_polygon
from staffsync.core.errors import Conflict, ValidationFailed
from staffsync.modules.attendance import rules
from staffsync.modules.attendance.verifiers import Evidence, run_pipeline
from staffsync.modules.leave.rules import count_days, next_status
from staffsync.modules.schedules.expansion import Rule, expand

NOW = datetime(2026, 10, 19, 7, 0, tzinfo=UTC)


def evidence(**kw) -> Evidence:
    base = dict(now=NOW, captured_at=NOW, lat=4.05, lng=9.76, accuracy_m=10, is_mock=False, inside=True, distance_m=0, site_min_accuracy_m=50, site_device_binding=True,
                require_selfie=False, require_qr=False, selfie_ok=False, qr_ok=False, shift_found=True, device_hash="d1", active_device_hash="d1", attestation_status="unverified", offline=False)
    base.update(kw)
    return Evidence(**base)


def reasons(ev):
    return sorted(f.reason for f in run_pipeline(ev))


def test_clean_checkin_has_no_flags():
    assert reasons(evidence()) == []


def test_each_verifier_flags_its_rule():
    assert reasons(evidence(inside=False, distance_m=420)) == ["OUTSIDE_GEOFENCE"]
    assert reasons(evidence(accuracy_m=120)) == ["LOW_ACCURACY"]
    assert reasons(evidence(is_mock=True)) == ["MOCK_LOCATION"]
    assert reasons(evidence(shift_found=False)) == ["UNSCHEDULED"]
    assert reasons(evidence(device_hash="other")) == ["DEVICE_MISMATCH"]
    assert reasons(evidence(captured_at=NOW - timedelta(hours=2))) == ["TIME_TAMPERED"]
    assert reasons(evidence(require_selfie=True)) == ["SELFIE_MISSING"]
    assert reasons(evidence(require_qr=True)) == ["QR_INVALID"]


def test_pipeline_collects_every_reason_instead_of_stopping():
    got = reasons(evidence(inside=False, distance_m=300, is_mock=True, accuracy_m=200, device_hash=None))
    assert got == ["DEVICE_MISMATCH", "LOW_ACCURACY", "MOCK_LOCATION", "OUTSIDE_GEOFENCE"]


def test_device_binding_off_skips_device_check():
    assert reasons(evidence(site_device_binding=False, device_hash=None)) == []


def test_offline_event_old_is_late_sync_but_not_tampered():
    assert reasons(evidence(offline=True, captured_at=NOW - timedelta(hours=60))) == ["LATE_SYNC"]
    assert reasons(evidence(offline=True, captured_at=NOW + timedelta(hours=2))) == ["TIME_TAMPERED"]


def test_impossible_travel():
    far = evidence(last_point=(4.05, 12.0, NOW - timedelta(minutes=10)))  # ~350 km in 10 min
    assert reasons(far) == ["IMPOSSIBLE_TRAVEL"]
    near = evidence(last_point=(4.0501, 9.7601, NOW - timedelta(minutes=10)))
    assert reasons(near) == []


def test_check_in_status_and_grace():
    start = NOW
    assert rules.check_in_result(start, 10, start + timedelta(minutes=10)).status == "on_time"
    r = rules.check_in_result(start, 10, start + timedelta(minutes=12))
    assert (r.status, r.late_min) == ("late", 12)
    assert rules.check_in_result(None, 10, start).status == "on_time"


def test_check_out_early_overtime_and_worked_minutes():
    cin, end = NOW, NOW + timedelta(hours=8)
    early = rules.check_out_result(end, 10, 15, cin, end - timedelta(minutes=45))
    assert (early.status, early.early_min) == ("early_leave", 45)
    over = rules.check_out_result(end, 10, 15, cin, end + timedelta(minutes=30))
    assert (over.status, over.overtime_min) == ("overtime", 30)
    ok = rules.check_out_result(end, 10, 15, cin, end + timedelta(minutes=5), break_min=60)
    assert ok.status is None and ok.worked_min == 8 * 60 + 5 - 60


def test_leave_day_counting():
    mon, fri, nxt_mon = date(2026, 10, 19), date(2026, 10, 23), date(2026, 10, 26)
    assert count_days(mon, fri, None, None, set()) == 5
    assert count_days(mon, nxt_mon, None, None, set()) == 6  # weekend skipped
    assert count_days(mon, fri, None, None, {date(2026, 10, 21)}) == 4  # public holiday skipped
    assert count_days(mon, fri, "afternoon", "morning", set()) == 4  # half days at both ends
    assert count_days(date(2026, 10, 24), date(2026, 10, 25), None, None, set()) == 0


def test_leave_state_machine():
    assert next_status("pending", "approve", levels=1) == "approved"
    assert next_status("recommended", "approve", levels=2) == "approved"
    with pytest.raises(Conflict):
        next_status("pending", "approve", levels=2)  # needs the site manager's recommendation first
    with pytest.raises(Conflict):
        next_status("rejected", "approve")
    with pytest.raises(Conflict):
        next_status("pending", "recommend", levels=1)
    assert next_status("approved", "request_cancellation") == "cancellation_requested"


DOUALA, PARIS = ZoneInfo("Africa/Douala"), ZoneInfo("Europe/Paris")


def rule(**kw):
    base = dict(type="recurring", days_of_week=(0, 1, 2, 3, 4), start_time=time(8), end_time=time(17), crosses_midnight=False, valid_from=date(2026, 3, 23), valid_to=None)
    base.update(kw)
    return Rule(**base)


def test_expansion_weekdays_only_and_utc_conversion():
    occ = expand(rule(), DOUALA, date(2026, 10, 19), date(2026, 10, 25))
    assert len(occ) == 5
    assert occ[0].starts_at == datetime(2026, 10, 19, 7, 0, tzinfo=UTC)  # Douala is UTC+1


def test_expansion_handles_daylight_saving_change():
    # Paris leaves summer time on Sun 2026-10-25: 08:00 local is 06:00Z before and 07:00Z after
    occ = expand(rule(days_of_week=(4, 0)), PARIS, date(2026, 10, 23), date(2026, 10, 26))
    assert [o.starts_at.hour for o in occ] == [6, 7]


def test_night_shift_crosses_midnight():
    occ = expand(rule(start_time=time(22), end_time=time(6), crosses_midnight=True, days_of_week=(0,)), DOUALA, date(2026, 10, 19), date(2026, 10, 19))
    assert occ[0].ends_at - occ[0].starts_at == timedelta(hours=8)
    assert occ[0].ends_at.date() == date(2026, 10, 20)


def test_end_before_start_is_treated_as_overnight():
    occ = expand(rule(start_time=time(22), end_time=time(6), days_of_week=(0,)), DOUALA, date(2026, 10, 19), date(2026, 10, 19))
    assert occ[0].ends_at > occ[0].starts_at


def test_rotation_two_weeks_days_then_nights():
    rot = {"pattern": [{"weeks": 2, "start": "06:00", "end": "14:00"}, {"weeks": 2, "start": "22:00", "end": "06:00", "crosses_midnight": True}]}
    r = rule(rotation=rot, valid_from=date(2026, 10, 19), days_of_week=(0,))
    mondays = expand(r, DOUALA, date(2026, 10, 19), date(2026, 11, 9))
    assert [o.starts_at.astimezone(DOUALA).hour for o in mondays] == [6, 6, 22, 22]


def test_intervention_is_single_occurrence_and_outside_window_is_empty():
    iv = rule(type="intervention", days_of_week=(), valid_from=date(2026, 10, 21), valid_to=date(2026, 10, 21))
    assert len(expand(iv, DOUALA, date(2026, 10, 19), date(2026, 10, 25))) == 1
    assert expand(iv, DOUALA, date(2026, 11, 1), date(2026, 11, 7)) == []


def test_geometry_validation_and_distance():
    square = {"type": "Polygon", "coordinates": [[[9.0, 4.0], [9.001, 4.0], [9.001, 4.001], [9.0, 4.001], [9.0, 4.0]]]}
    assert validate_polygon(square).is_valid
    bowtie = {"type": "Polygon", "coordinates": [[[9.0, 4.0], [9.001, 4.001], [9.001, 4.0], [9.0, 4.001], [9.0, 4.0]]]}
    with pytest.raises(ValidationFailed):
        validate_polygon(bowtie)
    tiny = {"type": "Polygon", "coordinates": [[[9.0, 4.0], [9.000001, 4.0], [9.000001, 4.000001], [9.0, 4.0]]]}
    with pytest.raises(ValidationFailed):
        validate_polygon(tiny)  # below the minimum area
    assert 110_000 < haversine_m(4.0, 9.0, 5.0, 9.0) < 112_000
    assert circle_polygon(9.0, 4.0, 100).is_valid
