import httpx
import pytest

from staffsync.core import adapters
from staffsync.core.adapters import Message, RoutingNotifier
from staffsync.core.config import get_settings
from tests.helpers import make_employee, seed_org, signup_owner


class Recorder:
    def __init__(self, status=200, body=None):
        self.calls = []
        self.status, self.body = status, body or {"data": {"status": "ok"}}

    def install(self, monkeypatch):
        async def post(client, url, **kw):
            self.calls.append((url, kw))
            return httpx.Response(self.status, json=self.body, request=httpx.Request("POST", url))

        monkeypatch.setattr(httpx.AsyncClient, "post", post)
        return self


@pytest.fixture
def settings(monkeypatch):
    s = get_settings()

    def setter(**values):
        for k, v in values.items():
            monkeypatch.setattr(s, k, v)

    return setter


def test_nothing_is_sent_for_real_without_configuration():
    assert RoutingNotifier().providers == {}


def test_providers_are_chosen_from_configuration(settings):
    settings(smtp_host="smtp.example.com", sms_provider="twilio", twilio_account_sid="AC1", twilio_auth_token="tok", twilio_from="+15550001111", expo_push_enabled=True)
    assert set(RoutingNotifier().providers) == {"email", "sms", "push"}
    settings(sms_provider="twilio", twilio_from=None, twilio_messaging_service_sid=None)
    assert "sms" not in RoutingNotifier().providers  # half-configured SMS stays off instead of failing every code
    settings(sms_provider="africastalking", africastalking_api_key="key")
    assert "sms" in RoutingNotifier().providers


async def test_twilio_request_shape(settings, monkeypatch):
    rec = Recorder(201, {"sid": "SM1"})
    rec.install(monkeypatch)
    settings(sms_provider="twilio", twilio_account_sid="AC123", twilio_auth_token="secret", twilio_from="+15550001111")
    await adapters.SmsGateway().send(Message("sms", "+237670000001", None, "Your code is 123456"))
    url, kw = rec.calls[0]
    assert url == "https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json"
    assert kw["data"] == {"To": "+237670000001", "Body": "Your code is 123456", "From": "+15550001111"} and kw["auth"] == ("AC123", "secret")


async def test_africastalking_request_shape(settings, monkeypatch):
    rec = Recorder()
    rec.install(monkeypatch)
    settings(sms_provider="africastalking", africastalking_username="sandbox", africastalking_api_key="k", africastalking_sender_id="StaffSync")
    await adapters.SmsGateway().send(Message("sms", "+2250712345678", None, "hello"))
    url, kw = rec.calls[0]
    assert url == "https://api.sandbox.africastalking.com/version1/messaging" and kw["headers"]["apiKey"] == "k"
    assert kw["data"] == {"username": "sandbox", "to": "+2250712345678", "message": "hello", "from": "StaffSync"}


async def test_expo_push_request_and_rejection(settings, monkeypatch):
    rec = Recorder(200, {"data": {"status": "ok"}})
    rec.install(monkeypatch)
    settings(expo_access_token="expo-secret")
    await adapters.ExpoPush().send(Message("push", "ExponentPushToken[abc]", "Amina", "Hello", {"type": "chat"}))
    url, kw = rec.calls[0]
    assert url == "https://exp.host/--/api/v2/push/send" and kw["headers"]["Authorization"] == "Bearer expo-secret"
    assert kw["json"] == {"to": "ExponentPushToken[abc]", "title": "Amina", "body": "Hello", "sound": "default", "data": {"type": "chat"}}
    bad = Recorder(200, {"data": {"status": "error", "message": "DeviceNotRegistered"}})
    bad.install(monkeypatch)
    with pytest.raises(RuntimeError, match="DeviceNotRegistered"):
        await adapters.ExpoPush().send(Message("push", "ExponentPushToken[abc]", "t", "b"))


async def test_a_failing_provider_never_breaks_the_caller_and_the_message_is_still_logged(settings, monkeypatch):
    Recorder(500).install(monkeypatch)
    settings(sms_provider="africastalking", africastalking_api_key="k", africastalking_username="u")
    n = RoutingNotifier()
    before = len(n.console.sent)
    await n.send(Message("sms", "+2250712345678", None, "Your StaffSync code is 111111"))
    assert len(n.console.sent) == before + 1


async def test_push_goes_to_active_phones_and_respects_preferences(client, mailbox, settings, monkeypatch):
    from sqlalchemy import update

    from staffsync.core.db import session_scope
    from staffsync.modules.auth.models import User
    from staffsync.modules.notifications.service import push_tokens
    from staffsync.workers.tasks import push_notifications

    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = await make_employee(admin, mailbox, ids)
    assert (await emp.client.put("/devices/me/push-token", headers={**emp.headers, "X-Device-Id": emp.device}, json={"push_token": "ExponentPushToken[emma]"})).status_code == 204
    me = (await emp.get("/me")).json()
    from uuid import UUID

    uid, cid = UUID(me["id"]), UUID(me["company_id"])
    async with session_scope(bypass=True) as s:
        assert await push_tokens(s, cid, {uid}) == ["ExponentPushToken[emma]"]
        await s.exec(update(User).values(notification_prefs={"leaveUpdates": False}).where(User.id == uid))  # type: ignore[arg-type]
    async with session_scope(bypass=True) as s:
        assert await push_tokens(s, cid, {uid}, pref="leaveUpdates") == []  # switched off
        assert await push_tokens(s, cid, {uid}, pref="shiftReminders") == ["ExponentPushToken[emma]"]
    # the worker pushes each new in-app notification once
    sent = []

    async def fake_notify(channel, to, body, *, subject=None, **data):
        sent.append((channel, to, subject))

    monkeypatch.setattr("staffsync.core.adapters.notify", fake_notify)
    from staffsync.modules.notifications.service import push_in_app

    async with session_scope(bypass=True) as s:
        push_in_app(s, cid, uid, "schedule_change", "Schedule updated", "Your Monday shift moved")
    async with session_scope(bypass=True) as s:
        assert await push_notifications(s) == 1
    import asyncio

    await asyncio.sleep(0.05)
    assert sent == [("push", "ExponentPushToken[emma]", "Schedule updated")]
    async with session_scope(bypass=True) as s:
        assert await push_notifications(s) == 0


async def test_profile_photo_round_trip(client, mailbox, tmp_path, monkeypatch):
    monkeypatch.setattr(get_settings(), "local_storage_dir", str(tmp_path))
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = await make_employee(admin, mailbox, ids)
    up = (await emp.post("/uploads/avatar", {"content_type": "image/jpeg", "size_bytes": 20})).json()
    me_id = (await emp.get("/me")).json()["id"]
    assert up["key"].startswith(f"avatars/{me_id}/")
    put = await client.put(up["url"].split("/api/v1", 1)[1], content=b"\xff\xd8jpegbytes", headers={"content-type": "image/jpeg"})
    assert put.status_code == 204
    # someone else's photo key cannot be claimed
    assert (await emp.patch("/me", {"avatar_key": "avatars/00000000-0000-0000-0000-000000000000/x.jpg"})).status_code == 400
    assert (await emp.patch("/me", {"avatar_key": up["key"]})).status_code == 200
    url = (await emp.get("/me")).json()["avatar_url"]
    assert url and (await client.get(url.split("/api/v1", 1)[1])).content == b"\xff\xd8jpegbytes"
    assert (await emp.get("/me/profile")).json()["photo_url"]
    assert (await emp.patch("/me", {"avatar_key": None})).status_code == 200
    assert (await emp.get("/me")).json()["avatar_url"] is None


async def test_company_export_is_a_zip_without_secrets_and_is_limited_to_once_an_hour(client, mailbox, tmp_path, monkeypatch):
    import io
    import zipfile

    monkeypatch.setattr(get_settings(), "local_storage_dir", str(tmp_path))
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    await make_employee(admin, mailbox, ids, name="Emma Employee")
    first = await admin.post("/company/export", {})
    assert first.status_code == 200 and first.json()["status"] == "ready"
    data = await client.get(first.json()["download_url"].split("/api/v1", 1)[1])
    z = zipfile.ZipFile(io.BytesIO(data.content))
    names = set(z.namelist())
    assert {"employees.csv", "sites.csv", "branches.csv", "people.csv", "README.txt"} <= names
    assert "Emma Employee" in z.read("people.csv").decode() and "Site A" in z.read("sites.csv").decode()
    everything = b"".join(z.read(n) for n in names).decode()
    assert "pin_hash" not in everything and "password_hash" not in everything
    assert any(m.channel == "email" and "export" in (m.subject or "").lower() for m in mailbox)
    assert (await admin.post("/company/export", {})).status_code == 429


async def test_erasing_an_employee_removes_their_identity_but_keeps_the_records(client, mailbox, tmp_path, monkeypatch):
    monkeypatch.setattr(get_settings(), "local_storage_dir", str(tmp_path))
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = await make_employee(admin, mailbox, ids, name="Emma Employee", phone="+237670000099")
    await emp.post("/uploads/avatar", {"content_type": "image/jpeg", "size_bytes": 10})
    assert (await admin.post(f"/employees/{emp.id}/erase", {"password": "wrong-password-1"})).status_code == 403
    assert (await admin.post(f"/employees/{emp.id}/erase", {"password": "correct-horse-battery"})).status_code == 204
    # the person can no longer sign in, and their name is gone from the company's lists
    again = await emp.client.post("/auth/otp/request", json={"identifier": "+237670000099"})
    assert again.status_code in (404, 403)
    names = [e.get("full_name") or e.get("name") for e in (await admin.get("/employees", params={"include_deleted": "true"})).json()]
    assert "Emma Employee" not in names
    assert any(a["action"] == "employee.erased" for a in (await admin.get("/audit-logs")).json()["items"])


def fake_google(monkeypatch, profile):
    """Replace the HTTP client used inside the SSO module only, so the test client itself is untouched."""
    from types import SimpleNamespace

    class Fake:
        def __init__(self, **kw):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            return False

        async def post(self, url, **kw):
            return httpx.Response(200, json={"access_token": "at"}, request=httpx.Request("POST", url))

        async def get(self, url, **kw):
            return httpx.Response(200, json=profile, request=httpx.Request("GET", url))

    monkeypatch.setattr("staffsync.modules.auth.sso.httpx", SimpleNamespace(AsyncClient=Fake))


async def sso_round_trip(client, monkeypatch, settings, profile, *, cookie=True, tamper=False):
    settings(google_client_id="gid", google_client_secret="gsecret", public_api_url="https://api.example.com", dashboard_url="https://app.example.com")
    started = await client.get("/auth/sso/google/authorize")
    assert started.status_code == 200
    url = started.json()["url"]
    assert url.startswith("https://accounts.google.com/o/oauth2/v2/auth?") and "redirect_uri=https%3A%2F%2Fapi.example.com%2Fapi%2Fv1%2Fauth%2Fsso%2Fgoogle%2Fcallback" in url
    import urllib.parse as up

    state = up.parse_qs(up.urlparse(url).query)["state"][0]
    nonce = started.headers["set-cookie"].split("ss_sso=")[1].split(";")[0]
    fake_google(monkeypatch, profile)
    headers = {"cookie": f"ss_sso={'x' + nonce if tamper else nonce}"} if cookie else {}
    return await client.get("/auth/sso/google/callback", params={"code": "abc", "state": state}, headers=headers)


async def test_sso_is_off_until_a_provider_is_configured(client):
    r = await client.get("/auth/sso/google/authorize")
    assert r.status_code == 403 and r.json()["code"] == "SSO_NOT_CONFIGURED"


async def test_sso_signs_in_an_existing_account_and_only_that(client, mailbox, settings, monkeypatch):
    admin = await signup_owner(client, mailbox)  # owner@example.com
    ok = await sso_round_trip(client, monkeypatch, settings, {"email": "Owner@Example.com", "email_verified": True})
    assert ok.status_code == 303 and ok.headers["location"] == "https://app.example.com/sso"
    cookies = ok.headers.get_list("set-cookie")
    assert any(c.startswith("ss_refresh=") and "HttpOnly" in c for c in cookies)
    # a stranger is not given an account
    stranger = await sso_round_trip(client, monkeypatch, settings, {"email": "nobody@example.com", "email_verified": True})
    assert stranger.headers["location"] == "https://app.example.com/sign-in?sso_error=not_invited"
    # an address the provider does not vouch for is refused
    unverified = await sso_round_trip(client, monkeypatch, settings, {"email": "owner@example.com", "email_verified": False})
    assert unverified.headers["location"].endswith("sso_error=unverified")
    # a sign-in finished in another browser than the one that started it is refused
    other = await sso_round_trip(client, monkeypatch, settings, {"email": "owner@example.com", "email_verified": True}, tamper=True)
    assert other.headers["location"].endswith("sso_error=failed")
    missing = await sso_round_trip(client, monkeypatch, settings, {"email": "owner@example.com", "email_verified": True}, cookie=False)
    assert missing.headers["location"].endswith("sso_error=failed")
    # the person cancelling at the provider comes back with an error and no code
    assert (await client.get("/auth/sso/google/callback", params={"error": "access_denied"})).headers["location"].endswith("sso_error=cancelled")
    assert admin.email == "owner@example.com"


async def test_report_pdf_export_downloads_as_a_pdf(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    await make_employee(admin, mailbox, ids)
    body = {"type": "timesheet", "date_from": "2026-10-01", "date_to": "2026-10-31", "group_by": "employee", "format": "pdf"}
    started = await admin.post("/reports/exports", body)
    assert started.status_code == 201, started.text
    got = await admin.get(f"/reports/exports/{started.json()['id']}")
    assert got.status_code == 200 and got.headers["content-type"] == "application/pdf" and got.content.startswith(b"%PDF")


async def test_scheduled_reports_are_e_mailed_once_per_period(client, mailbox, tmp_path, monkeypatch):
    from datetime import date

    from staffsync.core.db import session_scope
    from staffsync.modules.reports.scheduled import period, run_due

    monkeypatch.setattr(get_settings(), "local_storage_dir", str(tmp_path))
    admin = await signup_owner(client, mailbox)
    await seed_org(admin)
    definition = {"type": "timesheet", "date_from": "2026-10-01", "date_to": "2026-10-31", "group_by": "site"}
    saved = await admin.post("/reports/saved", {"name": "Weekly hours", "definition": definition, "schedule": {"frequency": "weekly", "recipients": ["hr@example.com", "boss@example.com", "not-an-address"], "format": "pdf"}})
    assert saved.status_code == 201, saved.text
    await admin.post("/reports/saved", {"name": "Manual only", "definition": definition})
    wednesday = date(2026, 10, 21)
    assert period("weekly", wednesday) == (date(2026, 10, 19), date(2026, 10, 12), date(2026, 10, 18))
    assert period("monthly", wednesday) == (date(2026, 10, 1), date(2026, 9, 1), date(2026, 9, 30))
    mailbox.clear()
    async with session_scope(bypass=True) as s:
        assert await run_due(s, wednesday) == 1
    mails = [m for m in mailbox if m.channel == "email"]
    assert {m.to for m in mails} == {"hr@example.com", "boss@example.com"} and "Weekly hours" in (mails[0].subject or "")
    link = mails[0].data["link"].split("/api/v1", 1)[1]
    assert (await client.get(link)).content.startswith(b"%PDF")
    # the same week again sends nothing; the next Monday sends it again
    async with session_scope(bypass=True) as s:
        assert await run_due(s, date(2026, 10, 23)) == 0
    async with session_scope(bypass=True) as s:
        assert await run_due(s, date(2026, 10, 26)) == 1


def test_play_integrity_verdicts():
    from staffsync.modules.attendance.attestation import judge_play_integrity

    good = {"appIntegrity": {"appRecognitionVerdict": "PLAY_RECOGNIZED"}, "deviceIntegrity": {"deviceRecognitionVerdict": ["MEETS_DEVICE_INTEGRITY"]}, "requestDetails": {"requestPackageName": "app.staffsync.mobile"}}
    assert judge_play_integrity(good, "app.staffsync.mobile")
    assert not judge_play_integrity({**good, "appIntegrity": {"appRecognitionVerdict": "UNRECOGNIZED_VERSION"}}, "app.staffsync.mobile")
    assert not judge_play_integrity({**good, "deviceIntegrity": {"deviceRecognitionVerdict": []}}, "app.staffsync.mobile")  # rooted or emulated
    assert not judge_play_integrity({**good, "requestDetails": {"requestPackageName": "evil.app"}}, "app.staffsync.mobile")


async def test_attestation_never_blocks_when_it_cannot_decide(settings, monkeypatch):
    from staffsync.modules.attendance import attestation

    assert await attestation.verify_attestation("android", None) == "unverified"
    assert await attestation.verify_attestation("android", "token") == "unverified"  # not configured
    assert await attestation.verify_attestation("ios", "token") == "unverified"  # App Attest is not checked yet
    settings(play_integrity_package_name="app.staffsync.mobile", google_service_account_file="/nonexistent.json")
    assert await attestation.verify_attestation("android", "token") == "unverified"  # credentials unreadable: no verdict, no flag


async def test_old_app_builds_are_told_to_update(client, mailbox, settings):
    settings(app_version_min="1.2.0")
    old = await client.get("/me", headers={"x-app-version": "1.1.9"})
    assert old.status_code == 426 and old.json()["code"] == "UPGRADE_REQUIRED"
    assert (await client.get("/me", headers={"x-app-version": "1.2.0"})).status_code == 401  # up to date: reaches the normal auth check
    assert (await client.get("/me")).status_code == 401  # the dashboard sends no version
    assert (await client.get("/health/live")).status_code == 200  # health checks are never blocked
    settings(app_version_min=None)
    assert (await client.get("/me", headers={"x-app-version": "0.0.1"})).status_code == 401


async def test_companies_past_due_become_read_only_after_the_grace_period(client, mailbox):
    from datetime import UTC, datetime, timedelta
    from uuid import UUID

    from sqlalchemy import update

    from staffsync.core.db import session_scope
    from staffsync.modules.billing.service import enforce_grace
    from staffsync.modules.companies.models import Company

    admin = await signup_owner(client, mailbox)
    cid = UUID((await admin.get("/me")).json()["company_id"])
    async with session_scope(bypass=True) as s:
        await s.exec(update(Company).values(subscription_status="past_due").where(Company.id == cid))  # type: ignore[arg-type]
        assert await enforce_grace(s) == 0  # just became overdue: still inside the grace period
    async with session_scope(bypass=True) as s:
        await s.exec(update(Company).values(updated_at=datetime.now(UTC) - timedelta(days=30)).where(Company.id == cid))  # type: ignore[arg-type]
    async with session_scope(bypass=True) as s:
        assert await enforce_grace(s) == 1
        assert (await s.get(Company, cid)).status == "read_only"
