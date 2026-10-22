from datetime import datetime, timedelta

from tests.helpers import SITE_LAT, SITE_LNG, TZ, event, make_employee, publish_daily_schedule, seed_org, signup_owner


async def world(client, mailbox, **kw):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = await make_employee(admin, mailbox, ids, **kw)
    await publish_daily_schedule(admin, ids, [emp.id])
    return admin, ids, emp


async def test_inside_geofence_checkin_is_clean_and_idempotent(client, mailbox):
    admin, ids, emp = await world(client, mailbox)
    ev = event("evt-0000001", site_id=ids["site_id"])
    r = await emp.post("/attendance/check-in", ev)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["flags"] == [] and body["record"]["status"] in ("on_time", "late")
    again = await emp.post("/attendance/check-in", ev)  # phone retry after a flaky network
    assert again.status_code == 200 and again.json()["record"]["id"] == body["record"]["id"]
    listing = (await admin.get("/attendance")).json()
    assert len(listing["items"]) == 1


async def test_outside_geofence_is_recorded_flagged_with_alert(client, mailbox):
    admin, ids, emp = await world(client, mailbox)
    r = await emp.post("/attendance/check-in", event("evt-0000002", site_id=ids["site_id"], lat=SITE_LAT + 0.004))  # ~440 m north
    assert r.status_code == 200, r.text  # never rejected for location
    flags = r.json()["flags"]
    assert flags[0]["reason"] == "OUTSIDE_GEOFENCE" and 250 < flags[0]["distance_m"] < 400
    assert r.json()["record"]["status"] == "flagged"
    alerts = (await admin.get("/alerts?tab=flagged")).json()["items"]
    assert len(alerts) == 1 and alerts[0]["reasons"] == ["OUTSIDE_GEOFENCE"]
    # admin approves -> the employee's record is valid again
    a = await admin.post(f"/alerts/{alerts[0]['id']}/approve", {"reason": "Entrance is outside the fence"})
    assert a.status_code == 200
    resp = await emp.get(f"/me/attendance/{r.json()['record']['id']}")
    assert resp.status_code == 200, resp.text
    rec = resp.json()
    assert rec["status"] != "flagged" and rec["flag_outcome"] == "approved"
    assert (await admin.post(f"/alerts/{alerts[0]['id']}/reject", {"reason": "changed my mind"})).status_code == 409  # state machine


async def test_mock_location_wrong_device_and_low_accuracy_all_collected(client, mailbox):
    admin, ids, emp = await world(client, mailbox)
    emp.device = "another-phone-1"
    r = await emp.post("/attendance/check-in", event("evt-0000003", site_id=ids["site_id"], is_mock_location=True, accuracy=300))
    reasons = sorted(f["reason"] for f in r.json()["flags"])
    assert reasons == ["DEVICE_MISMATCH", "LOW_ACCURACY", "MOCK_LOCATION"]


async def test_second_phone_cannot_register_until_admin_resets(client, mailbox):
    admin, ids, emp = await world(client, mailbox)
    r = await emp.post("/devices/register", {"device_id": "brand-new-phone", "platform": "ios"})
    assert r.status_code == 409 and r.json()["code"] == "DEVICE_BOUND"
    assert (await admin.post(f"/employees/{emp.id}/device/reset")).status_code == 204
    assert (await emp.get("/me/shifts/today")).status_code == 401  # sessions were revoked with the device


async def test_double_checkin_blocked_and_checkout_summary(client, mailbox):
    admin, ids, emp = await world(client, mailbox)
    assert (await emp.post("/attendance/check-in", event("evt-0000004", site_id=ids["site_id"]))).status_code == 200
    dup = await emp.post("/attendance/check-in", event("evt-0000005", site_id=ids["site_id"]))
    assert dup.status_code == 409 and dup.json()["code"] == "ALREADY_CHECKED_IN"
    out = await emp.post("/attendance/check-out", event("evt-0000006", note="done"))
    assert out.status_code == 200, out.text
    rec = out.json()["record"]
    assert rec["check_out_at"] and rec["worked_minutes"] is not None and rec["early_by_minutes"] is not None  # a 24h shift: leaving now is early
    assert (await emp.post("/attendance/check-out", event("evt-0000007"))).status_code == 409  # nothing open


async def test_unscheduled_site_needs_confirmation_then_flags(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = await make_employee(admin, mailbox, ids)  # no schedule at all
    r = await emp.post("/attendance/check-in", event("evt-0000008", site_id=ids["site_id"]))
    assert r.status_code == 422 and r.json()["code"] == "UNSCHEDULED"
    ok = await emp.post("/attendance/check-in", event("evt-0000009", site_id=ids["site_id"], accept_unscheduled=True))
    assert ok.status_code == 200 and [f["reason"] for f in ok.json()["flags"]] == ["UNSCHEDULED"]


async def test_offline_sync_orders_events_dedupes_and_labels(client, mailbox):
    admin, ids, emp = await world(client, mailbox)
    t_in = datetime.now(TZ) - timedelta(minutes=20)
    t_out = datetime.now(TZ) - timedelta(minutes=5)
    events = [  # sent out of order on purpose
        {**event("evt-out-0001", at=t_out), "type": "check_out"},
        {**event("evt-in-00001", at=t_in, site_id=ids["site_id"]), "type": "check_in"},
        {**event("evt-in-00001", at=t_in, site_id=ids["site_id"]), "type": "check_in"},  # duplicate
        {"client_event_id": "evt-bad-001", "lat": SITE_LAT, "lng": SITE_LNG, "accuracy_m": 5, "captured_at": t_in.isoformat()},  # no type
    ]
    r = await emp.post("/attendance/sync", {"events": events})
    assert r.status_code == 200, r.text
    results = {x["client_event_id"]: x for x in r.json()["results"]}
    assert results["evt-in-00001"]["ok"] and results["evt-out-0001"]["ok"]
    assert not results["evt-bad-001"]["ok"] and results["evt-bad-001"]["error"]["code"] == "VALIDATION"
    rec = results["evt-out-0001"]["result"]["record"]
    assert rec["offline_synced"] and rec["check_in_at"] and rec["check_out_at"]
    assert len((await admin.get("/attendance?offline_only=true")).json()["items"]) == 1


async def test_proxy_checkin_with_pin_attempt_lockout(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    mgr = await make_employee(admin, mailbox, ids, phone="+237670000009", name="Mia Manager", no="M-1")
    worker = await make_employee(admin, mailbox, ids, name="No Phone", no="E-2", phone="+237670000002", smartphone=False)
    worker_ids = await admin.post(f"/employees/{worker.id}/badge")
    pin = worker_ids.json()["pin"]
    # promote Mia to site manager of the site
    me = (await mgr.get("/me")).json()
    assert (await admin.put(f"/sites/{ids['site_id']}/managers", {"ids": [me["id"]]})).status_code == 200
    await publish_daily_schedule(admin, ids, [worker.id])
    base = {"employee_id": worker.id, "site_id": ids["site_id"], "lat": SITE_LAT, "lng": SITE_LNG}
    # the manager mode needs the role; site managers hold ATTENDANCE_PROXY via a system role
    roles = (await admin.get("/roles")).json()
    sm = next(r for r in roles if r["key"] == "site_manager")
    inv = await admin.post("/users/invite", {"email": "mia@example.com", "full_name": "Mia Manager", "role_id": sm["id"], "scope_type": "sites", "scope_ids": [ids["site_id"]]})
    assert inv.status_code == 201, inv.text
    # PIN failures lock after 5 tries; use an admin-held token with the site-manager permission for the call
    tok = (await client.post("/auth/login", json={"email": "owner@example.com", "password": "correct-horse-battery"})).json()["tokens"]["access_token"]
    h = {"authorization": f"Bearer {tok}"}
    for i in range(4):
        r = await client.post("/attendance/proxy/check-in", headers=h, json={**base, "pin": "0000" if pin != "0000" else "1111", "client_event_id": f"proxy-bad-{i:03d}"})
        assert r.status_code == 422 and r.json()["code"] == "PIN_INVALID" and r.json()["attempts_left"] == 4 - i
    r = await client.post("/attendance/proxy/check-in", headers=h, json={**base, "pin": "0000" if pin != "0000" else "1111", "client_event_id": "proxy-bad-005"})
    assert r.status_code == 429 and r.json()["code"] == "PIN_LOCKED"
    r = await client.post("/attendance/proxy/check-in", headers=h, json={**base, "pin": pin, "client_event_id": "proxy-good-01"})
    assert r.status_code == 429  # still locked even with the right PIN
