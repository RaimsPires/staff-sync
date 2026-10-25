from tests.helpers import PASSWORD, seed_org, signup_owner


async def test_signup_verify_login_me(client, mailbox):
    admin = await signup_owner(client, mailbox)
    me = (await admin.get("/me")).json()
    assert "billing.manage" in me["permissions"] and me["roles"] == ["Super admin"]
    r = await client.post("/auth/login", json={"email": "owner@example.com", "password": PASSWORD})
    assert r.status_code == 200 and r.json()["tokens"]["access_token"]


async def test_wrong_password_and_lockout(client, mailbox):
    await signup_owner(client, mailbox)
    for _ in range(5):
        r = await client.post("/auth/login", json={"email": "owner@example.com", "password": "nope-nope-nope"})
        assert r.status_code == 401 and r.json()["code"] == "INVALID_CREDENTIALS"
    r = await client.post("/auth/login", json={"email": "owner@example.com", "password": PASSWORD})
    assert r.status_code == 429 and r.json()["code"] == "ACCOUNT_LOCKED"


async def test_refresh_rotation_and_reuse_detection(client, mailbox):
    admin = await signup_owner(client, mailbox)
    first = admin.extra["tokens"]["refresh_token"]
    r = await client.post("/auth/refresh", json={"refresh_token": first})
    assert r.status_code == 200
    second = r.json()["refresh_token"]
    assert second != first
    # right after rotation the old token still works once more: a browser may have dropped the first response
    r = await client.post("/auth/refresh", json={"refresh_token": first})
    assert r.status_code == 200
    second = r.json()["refresh_token"]
    # later, replaying the old token is treated as theft and revokes the whole family
    from datetime import UTC, datetime, timedelta

    from sqlalchemy import update

    from staffsync.core.db import session_scope
    from staffsync.modules.auth.models import RefreshToken

    async with session_scope(bypass=True) as s:
        await s.exec(update(RefreshToken).values(rotated_at=datetime.now(UTC) - timedelta(minutes=5)).where(RefreshToken.rotated_at.is_not(None)))  # type: ignore[union-attr,attr-defined]
    r = await client.post("/auth/refresh", json={"refresh_token": first})
    assert r.status_code == 401 and r.json()["code"] == "REFRESH_REUSE"
    r = await client.post("/auth/refresh", json={"refresh_token": second})
    assert r.status_code == 401
    assert (await admin.get("/me")).status_code == 401  # access token of the revoked session is dead too


async def test_problem_details_shape(client):
    r = await client.get("/me")
    assert r.status_code == 401
    body = r.json()
    assert r.headers["content-type"].startswith("application/problem+json")
    assert {"type", "title", "status", "code", "detail", "request_id"} <= body.keys()


async def test_site_geofence_and_cross_tenant_404(client, mailbox):
    a = await signup_owner(client, mailbox, "a@example.com", "A Corp")
    ids = await seed_org(a)
    site = (await a.get(f"/sites/{ids['site_id']}")).json()
    assert site["geofence_kind"] == "circle" and site["geofence_geojson"]["type"] == "Polygon"
    b = await signup_owner(client, mailbox, "b@example.com", "B Corp")
    assert (await b.get(f"/sites/{ids['site_id']}")).status_code == 404  # other tenant: not revealed
    assert (await b.get("/sites")).json() == []


async def test_invalid_polygon_rejected(client, mailbox):
    a = await signup_owner(client, mailbox)
    br = (await a.post("/branches", {"name": "HQ", "code": "HQ"})).json()
    bowtie = {"type": "Polygon", "coordinates": [[[9.0, 4.0], [9.001, 4.001], [9.001, 4.0], [9.0, 4.001], [9.0, 4.0]]]}
    r = await a.post("/sites", {"name": "Bowtie", "code": "X", "branch_id": br["id"], "geofence": {"type": "polygon", "geojson": bowtie}})
    assert r.status_code == 400 and r.json()["code"] == "INVALID_POLYGON", r.text


async def test_site_code_reuse_after_soft_delete(client, mailbox):
    a = await signup_owner(client, mailbox)
    ids = await seed_org(a)
    assert (await a.delete(f"/sites/{ids['site_id']}", {"reason": "closing"})).status_code == 409  # must deactivate first
    await a.post(f"/sites/{ids['site_id']}/deactivate")
    assert (await a.delete(f"/sites/{ids['site_id']}", {"reason": "closed down"})).status_code == 204
    assert (await a.get("/sites")).json() == []
    trash = await a.get("/sites?only_deleted=true")
    assert len(trash.json()) == 1
    again = await a.post("/sites", {"name": "New A", "code": "A", "branch_id": ids["branch_id"], "geofence": {"type": "circle", "center": [9.77, 4.05], "radius_m": 100}})
    assert again.status_code == 201  # code freed by the partial unique index
    assert (await a.post(f"/sites/{ids['site_id']}/restore")).status_code == 409


async def test_signup_with_a_phone_number_already_used_by_another_account_is_a_clear_conflict(client, mailbox):
    body = {"full_name": "First Founder", "email": "first@example.com", "password": "correct-horse-battery", "phone": "+237670000123", "company_name": "First Co", "accept_terms": True}
    assert (await client.post("/auth/signup", json=body)).status_code == 201
    second = await client.post("/auth/signup", json={**body, "full_name": "Second Founder", "email": "second@example.com", "company_name": "Second Co"})
    assert second.status_code == 409, second.text
    assert second.json()["code"] == "PHONE_TAKEN"


async def test_mobile_login_needs_password_then_a_code_sent_by_email(client, mailbox):
    from tests.helpers import last_code, seed_org

    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    r = await admin.post("/employees", {"full_name": "Eva Employee", "employee_no": "E-9", "phone": "+237670000055", "email": "eva@example.com", "branch_id": ids["branch_id"], "site_ids": [ids["site_id"]], "has_smartphone": True, "send_invite": False})
    assert r.status_code == 201, r.text
    # an account without a password signs in with the code alone, once, and is told to create a password
    mailbox.clear()
    first = await client.post("/auth/otp/request", json={"identifier": "eva@example.com"})
    assert first.status_code == 200 and first.json()["password_setup_required"] is True
    assert mailbox[-1].channel == "email" and mailbox[-1].to == "eva@example.com"
    v = await client.post("/auth/otp/verify", json={"identifier": "eva@example.com", "code": last_code(mailbox)})
    assert v.status_code == 200 and v.json()["needs_password"] is True
    h = {"authorization": f"Bearer {v.json()['tokens']['access_token']}"}
    assert (await client.post("/me/password/initial", headers=h, json={"new_password": "Eva-long-password-1"})).status_code == 204
    assert (await client.post("/me/password/initial", headers=h, json={"new_password": "Another-long-pass-2"})).status_code == 409
    # from now on the password comes first, whether the person types the e-mail address or the phone number
    from staffsync.core.redis import get_redis

    await get_redis().flushdb()
    for who in ("eva@example.com", "+237670000055"):
        missing = await client.post("/auth/otp/request", json={"identifier": who})
        assert missing.status_code == 401 and missing.json()["code"] == "PASSWORD_REQUIRED"
        wrong = await client.post("/auth/otp/request", json={"identifier": who, "password": "not-the-password-1"})
        assert wrong.status_code == 401 and wrong.json()["code"] == "INVALID_CREDENTIALS"
    mailbox.clear()
    ok = await client.post("/auth/otp/request", json={"identifier": "+237670000055", "password": "Eva-long-password-1"})
    assert ok.status_code == 200 and ok.json()["password_setup_required"] is False
    # the code goes to the e-mail address even though the phone number was typed
    assert mailbox[-1].channel == "email" and mailbox[-1].to == "eva@example.com"
    v2 = await client.post("/auth/otp/verify", json={"identifier": "+237670000055", "code": last_code(mailbox)})
    assert v2.status_code == 200 and v2.json()["needs_password"] is False
