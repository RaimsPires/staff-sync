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
    # replaying the old token revokes the whole family
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
    assert r.status_code == 400 and "polygon" in r.json()["detail"].lower(), r.text


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
