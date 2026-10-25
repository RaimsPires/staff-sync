"""App attestation (Play Integrity / App Attest).

A verdict only ever adds a flag: `failed` marks the device, while `unverified` (no token, not configured, or a platform
we cannot check yet) never blocks a check-in on its own.

* Android: the Play Integrity token is decoded by Google (set PLAY_INTEGRITY_PACKAGE_NAME and GOOGLE_SERVICE_ACCOUNT_FILE).
* iOS: App Attest needs the attestation certificate chain checked against Apple's root; that part is not built yet, so iOS
  devices stay `unverified` even with APPLE_APP_ID set.
"""

import asyncio

import httpx

from staffsync.core.config import get_settings
from staffsync.core.logging import get_logger

log = get_logger("attestation")
SCOPE = "https://www.googleapis.com/auth/playintegrity"


def _access_token(path: str) -> str:
    from google.auth.transport.requests import Request
    from google.oauth2 import service_account

    creds = service_account.Credentials.from_service_account_file(path, scopes=[SCOPE])
    creds.refresh(Request())
    return creds.token


def judge_play_integrity(payload: dict, package: str) -> bool:
    """Whether a decoded Play Integrity verdict describes our genuine app on a genuine device."""
    app = payload.get("appIntegrity", {})
    device = payload.get("deviceIntegrity", {})
    request = payload.get("requestDetails", {})
    return (
        app.get("appRecognitionVerdict") == "PLAY_RECOGNIZED"
        and "MEETS_DEVICE_INTEGRITY" in device.get("deviceRecognitionVerdict", [])
        and request.get("requestPackageName", package) == package
    )


async def _play_integrity(token: str) -> str:
    s = get_settings()
    package, key_file = s.play_integrity_package_name, s.google_service_account_file
    try:
        bearer = await asyncio.to_thread(_access_token, key_file)  # type: ignore[arg-type]
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(f"https://playintegrity.googleapis.com/v1/{package}:decodeIntegrityToken", json={"integrity_token": token}, headers={"Authorization": f"Bearer {bearer}"})
        if r.status_code == 400:
            return "failed"  # Google rejected the token itself: forged, expired or for another app
        r.raise_for_status()
        return "passed" if judge_play_integrity(r.json().get("tokenPayloadExternal", {}), package or "") else "failed"
    except Exception as exc:  # Google unreachable or our credentials wrong: that says nothing about the device
        log.error("play_integrity_unavailable", error=str(exc))
        return "unverified"


async def verify_attestation(platform: str, token: str | None) -> str:
    if not token:
        return "unverified"
    s = get_settings()
    if platform == "android" and s.play_integrity_package_name and s.google_service_account_file:
        return await _play_integrity(token)
    return "unverified"
