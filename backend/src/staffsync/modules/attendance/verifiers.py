"""Check-in verification: a pipeline of Strategy objects. Each verifier inspects the evidence and returns flags;
the pipeline runs all of them (it never stops at the first) so the admin sees every reason."""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Protocol

from staffsync.common.geo import haversine_m


@dataclass
class Flag:
    reason: str
    distance_m: float | None = None
    detail: str | None = None

    def as_dict(self) -> dict:
        return {k: v for k, v in {"reason": self.reason, "distance_m": self.distance_m, "detail": self.detail}.items() if v is not None}


@dataclass
class Evidence:
    now: datetime
    captured_at: datetime
    lat: float
    lng: float
    accuracy_m: float
    is_mock: bool
    inside: bool
    distance_m: float
    site_min_accuracy_m: int
    site_device_binding: bool
    require_selfie: bool
    require_qr: bool
    selfie_ok: bool  # key present AND belongs to this user
    qr_ok: bool
    shift_found: bool
    device_hash: str | None
    active_device_hash: str | None
    attestation_status: str
    offline: bool
    last_point: tuple[float, float, datetime] | None = None  # lat, lng, at
    time_tolerance_s: int = 300
    max_sync_delay_h: int = 48
    max_speed_kmh: float = 200
    block_mock: bool = False
    skip: set[str] = field(default_factory=set)  # verifier names to skip (e.g. schedule on check-out)


class Verifier(Protocol):
    name: str

    def check(self, ev: Evidence) -> list[Flag]: ...


class DeviceVerifier:
    name = "device"

    def check(self, ev: Evidence) -> list[Flag]:
        if not ev.site_device_binding:
            return []
        if ev.attestation_status == "failed":
            return [Flag("DEVICE_MISMATCH", detail="attestation failed")]
        if ev.active_device_hash is None or ev.device_hash is None or ev.device_hash != ev.active_device_hash:
            return [Flag("DEVICE_MISMATCH")]
        return []


class ScheduleVerifier:
    name = "schedule"

    def check(self, ev: Evidence) -> list[Flag]:
        return [] if ev.shift_found else [Flag("UNSCHEDULED")]


class GeofenceVerifier:
    name = "geofence"

    def check(self, ev: Evidence) -> list[Flag]:
        return [] if ev.inside else [Flag("OUTSIDE_GEOFENCE", distance_m=round(ev.distance_m, 1))]


class AccuracyVerifier:
    name = "accuracy"

    def check(self, ev: Evidence) -> list[Flag]:
        return [Flag("LOW_ACCURACY", detail=f"{ev.accuracy_m:.0f} m > {ev.site_min_accuracy_m} m")] if ev.accuracy_m > ev.site_min_accuracy_m else []


class MockLocationVerifier:
    name = "mock"

    def check(self, ev: Evidence) -> list[Flag]:
        return [Flag("MOCK_LOCATION")] if ev.is_mock else []


class TimeVerifier:
    name = "time"

    def check(self, ev: Evidence) -> list[Flag]:
        tol = timedelta(seconds=ev.time_tolerance_s)
        if ev.offline:
            flags = []
            if ev.captured_at > ev.now + tol:
                flags.append(Flag("TIME_TAMPERED", detail="event is in the future"))
            if ev.now - ev.captured_at > timedelta(hours=ev.max_sync_delay_h):
                flags.append(Flag("LATE_SYNC"))
            return flags
        return [Flag("TIME_TAMPERED")] if abs(ev.captured_at - ev.now) > tol else []


class SpeedVerifier:
    name = "speed"

    def check(self, ev: Evidence) -> list[Flag]:
        if ev.last_point is None:
            return []
        lat, lng, at = ev.last_point
        dt = (ev.captured_at - at).total_seconds()
        dist = haversine_m(lat, lng, ev.lat, ev.lng)
        if dt <= 0 or dist < 500:  # ignore GPS jitter and unordered events
            return []
        kmh = dist / dt * 3.6
        return [Flag("IMPOSSIBLE_TRAVEL", detail=f"{kmh:.0f} km/h")] if kmh > ev.max_speed_kmh else []


class SelfieQrVerifier:
    name = "selfie_qr"

    def check(self, ev: Evidence) -> list[Flag]:
        flags = []
        if ev.require_selfie and not ev.selfie_ok:
            flags.append(Flag("SELFIE_MISSING"))
        if ev.require_qr and not ev.qr_ok:
            flags.append(Flag("QR_INVALID"))
        return flags


DEFAULT_PIPELINE: tuple[Verifier, ...] = (
    DeviceVerifier(), ScheduleVerifier(), GeofenceVerifier(), AccuracyVerifier(), MockLocationVerifier(), TimeVerifier(), SpeedVerifier(), SelfieQrVerifier(),
)


def run_pipeline(ev: Evidence, verifiers: tuple[Verifier, ...] = DEFAULT_PIPELINE) -> list[Flag]:
    flags: list[Flag] = []
    for v in verifiers:
        if v.name not in ev.skip:
            flags.extend(v.check(ev))
    return flags
