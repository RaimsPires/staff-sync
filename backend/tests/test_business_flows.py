from datetime import date, datetime, timedelta

from tests.helpers import SITE_LAT, TZ, event, make_employee, publish_daily_schedule, seed_org, signup_owner


def next_monday(offset_weeks=1) -> date:
    d = date.today() + timedelta(days=7 * offset_weeks)
    return d - timedelta(days=d.weekday())


async def leave_type(admin, **kw) -> str:
    r = await admin.post("/leave/types", {"name_en": "Annual", "name_fr": "Annuel", "yearly_allowance": 20, **kw})
    assert r.status_code == 201, r.text
    return r.json()["id"]


async def test_leave_request_balance_and_approval_side_effects(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = await make_employee(admin, mailbox, ids)
    lt = await leave_type(admin)
    mon = next_monday()
    draft = {"leave_type_id": lt, "start_date": mon.isoformat(), "end_date": (mon + timedelta(days=2)).isoformat(), "reason": "family"}
    pv = (await emp.post("/me/leave/requests/preview", draft)).json()
    assert pv["days"] == 3 and pv["remaining_after"] == 17
    r = await emp.post("/me/leave/requests", draft)
    assert r.status_code == 201, r.text
    req = r.json()
    bal = (await emp.get("/me/leave/balances")).json()
    assert bal[0]["pending"] == 3 and bal[0]["remaining"] == 17
    # overlapping second request is refused
    assert (await emp.post("/me/leave/requests", draft)).status_code == 422
    # admin approves: pending -> used, balance consistent, employee notified
    ok = await admin.post(f"/leave/requests/{req['id']}/approve", {"comment": "enjoy"})
    assert ok.status_code == 200 and ok.json()["status"] == "approved"
    bal = (await emp.get("/me/leave/balances")).json()
    assert (bal[0]["pending"], bal[0]["used"], bal[0]["remaining"]) == (0, 3, 17)
    notes = (await emp.get("/me/notifications")).json()
    assert any(n["type"] == "leave_decision" for n in notes)
    assert (await admin.post(f"/leave/requests/{req['id']}/approve", {})).status_code == 409
    # employee asks to cancel approved leave; admin cancels -> balance restored
    c = await emp.post(f"/me/leave/requests/{req['id']}/cancel", {"comment": "plans changed"})
    assert c.json()["status"] == "cancellation_requested"
    done = await admin.post(f"/leave/requests/{req['id']}/cancel", {"comment": "ok"})
    assert done.json()["status"] == "cancelled"
    assert (await emp.get("/me/leave/balances")).json()[0]["used"] == 0


async def test_leave_reject_requires_reason_and_releases_balance(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = await make_employee(admin, mailbox, ids)
    lt = await leave_type(admin)
    mon = next_monday()
    req = (await emp.post("/me/leave/requests", {"leave_type_id": lt, "start_date": mon.isoformat(), "end_date": mon.isoformat()})).json()
    assert (await admin.post(f"/leave/requests/{req['id']}/reject", {})).status_code == 400  # comment required
    rej = await admin.post(f"/leave/requests/{req['id']}/reject", {"comment": "busy week"})
    assert rej.json()["status"] == "rejected"
    assert (await emp.get("/me/leave/balances")).json()[0]["pending"] == 0
    tl = (await emp.get(f"/me/leave/requests/{req['id']}")).json()["timeline"]
    assert [t["action"] for t in tl] == ["submitted", "rejected"]


async def test_two_level_approval_needs_recommendation_first(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    assert (await admin.patch("/settings/leave-policy", {"levels": 2})).status_code == 200
    emp = await make_employee(admin, mailbox, ids)
    lt = await leave_type(admin)
    mon = next_monday()
    req = (await emp.post("/me/leave/requests", {"leave_type_id": lt, "start_date": mon.isoformat(), "end_date": mon.isoformat()})).json()
    assert req["levels"] == 2
    early = await admin.post(f"/leave/requests/{req['id']}/approve", {})
    assert early.status_code == 409 and early.json()["code"] == "RECOMMENDATION_REQUIRED"
    assert (await admin.post(f"/leave/requests/{req['id']}/recommend", {"decision": "approve", "comment": "fine by me"})).json()["status"] == "recommended"
    assert (await admin.post(f"/leave/requests/{req['id']}/approve", {})).json()["status"] == "approved"


async def test_schedule_conflicts_and_publish_gate(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = await make_employee(admin, mailbox, ids)
    body = {"type": "recurring", "site_id": ids["site_id"], "title": "Morning", "days_of_week": [0, 1, 2, 3, 4], "start_time": "08:00", "end_time": "17:00",
            "valid_from": next_monday().isoformat(), "employee_ids": [emp.id]}
    first = (await admin.post("/schedules", body)).json()
    assert (await admin.post("/schedules/publish", {"schedule_ids": [first["id"]], "notify": False})).status_code == 200
    second = (await admin.post("/schedules", {**body, "title": "Overlap", "start_time": "10:00", "end_time": "12:00"})).json()
    v = (await admin.post("/schedules/validate", {**body, "start_time": "10:00", "end_time": "12:00"})).json()
    assert "OVERLAP" in {c["code"] for c in v["conflicts"]}
    blocked = await admin.post("/schedules/publish", {"schedule_ids": [second["id"]], "notify": False})
    assert blocked.status_code == 409 and blocked.json()["code"] == "SCHEDULE_CONFLICTS"
    # deleting a published schedule cancels its future shifts and is restorable
    assert (await admin.delete(f"/schedules/{first['id']}", {"reason": "restructure"})).status_code == 204
    shifts = (await admin.get("/shifts", params={"from": datetime.now(TZ).isoformat(), "to": (datetime.now(TZ) + timedelta(days=30)).isoformat()})).json()
    assert all(s["status"] == "cancelled" for s in shifts if s["schedule_id"] == first["id"])
    assert (await admin.post(f"/schedules/{first['id']}/restore")).status_code == 200


async def test_role_escalation_blocked_and_owner_protected(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    roles = {r["key"]: r for r in (await admin.get("/roles")).json() if r["key"]}
    inv = await admin.post("/users/invite", {"email": "hr@example.com", "full_name": "Hana HR", "role_id": roles["branch_admin"]["id"], "scope_type": "branches", "scope_ids": [ids["branch_id"]]})
    assert inv.status_code == 201, inv.text
    custom = await admin.post("/roles", {"name": "Ops", "permissions": ["attendance.view", "alerts.view"]})
    assert custom.status_code == 201
    assert (await admin.patch(f"/roles/{roles['owner']['id']}", {"name": "xx"})).status_code == 409  # system roles are locked
    me = (await admin.get("/me")).json()
    last = await admin.post(f"/users/{me['id']}/revoke")
    assert last.status_code == 422 and last.json()["code"] == "SELF_REVOKE"


async def test_correction_accept_updates_record_and_notifies(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = await make_employee(admin, mailbox, ids)
    await publish_daily_schedule(admin, ids, [emp.id])
    rec = (await emp.post("/attendance/check-in", event("evt-corr-0001", site_id=ids["site_id"]))).json()["record"]
    fix_out = (datetime.now(TZ) + timedelta(hours=1)).isoformat()
    c = await emp.post(f"/me/attendance/{rec['id']}/corrections", {"kind": "forgot_checkout", "proposed_out": fix_out, "comment": "forgot to check out"})
    assert c.status_code == 201, c.text
    assert (await emp.post(f"/me/attendance/{rec['id']}/corrections", {"kind": "forgot_checkout", "proposed_out": fix_out, "comment": "again"})).status_code == 409
    acc = await admin.post(f"/corrections/{c.json()['id']}/accept", {"note": "ok"})
    assert acc.status_code == 200 and acc.json()["status"] == "accepted"
    detail = (await admin.get(f"/attendance/{rec['id']}")).json()
    assert detail["record"]["check_out_at"] and len(detail["history"]) == 1
    assert (await admin.post(f"/corrections/{c.json()['id']}/decline", {"reason": "x" * 5})).status_code == 409


async def test_attendance_edit_needs_reason_if_match_and_soft_delete_restore(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = await make_employee(admin, mailbox, ids)
    await publish_daily_schedule(admin, ids, [emp.id])
    rec = (await emp.post("/attendance/check-in", event("evt-edit-0001", site_id=ids["site_id"]))).json()["record"]
    new_in = (datetime.now(TZ) - timedelta(hours=1)).isoformat()
    assert (await admin.patch(f"/attendance/{rec['id']}", {"check_in_at": new_in})).status_code == 400  # reason is mandatory
    stale = await admin.patch(f"/attendance/{rec['id']}", {"check_in_at": new_in, "reason": "badge reader down"}, headers={"If-Match": '"99"'})
    assert stale.status_code == 409 and stale.json()["code"] == "VERSION_CONFLICT"
    ok = await admin.patch(f"/attendance/{rec['id']}", {"check_in_at": new_in, "reason": "badge reader down"}, headers={"If-Match": '"1"'})
    assert ok.status_code == 200 and ok.headers["etag"] == '"2"'
    assert (await admin.delete(f"/attendance/{rec['id']}", {"reason": "duplicate entry"})).status_code == 204
    assert (await admin.get("/attendance")).json()["items"] == []
    assert len((await admin.get("/attendance?only_deleted=true")).json()["items"]) == 1
    assert (await admin.post(f"/attendance/{rec['id']}/restore")).status_code == 200
    audit = (await admin.get("/audit-logs?action=attendance")).json()["items"]
    assert {"attendance.edited", "attendance.deleted", "attendance.restored"} <= {a["action"] for a in audit}


async def test_live_board_manager_summary_and_dashboard(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = await make_employee(admin, mailbox, ids)
    await publish_daily_schedule(admin, ids, [emp.id])
    await emp.post("/attendance/check-in", event("evt-live-0001", site_id=ids["site_id"], lat=SITE_LAT + 0.01))  # flagged
    live = (await admin.get("/attendance/live")).json()
    assert live[0]["counters"]["expected"] == 1 and live[0]["counters"]["flagged"] == 1 and live[0]["rows"][0]["flags"]
    summ = (await admin.get(f"/manager/sites/{ids['site_id']}/summary")).json()
    assert summ["present"] == 1 and summ["flagged"] == 1
    ov = (await admin.get("/dashboard/overview")).json()
    assert ov["kpis"]["present"] == 1 and ov["needs_attention"]["flagged"] == 1
    assert (await admin.get("/search?q=emma")).json()["employees"][0]["name"] == "Emma Employee"


async def test_employee_limit_and_trash(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = await make_employee(admin, mailbox, ids)
    assert (await admin.post(f"/employees/{emp.id}/deactivate")).status_code == 200
    assert (await admin.delete(f"/employees/{emp.id}", {"reason": "left company"})).status_code == 204
    trash = (await admin.get("/trash")).json()
    assert trash[0]["type"] == "employee" and trash[0]["reason"] == "left company"
    assert (await admin.post(f"/employees/{emp.id}/restore")).status_code == 200
    assert (await admin.post(f"/employees/{emp.id}/reactivate")).status_code == 200
    from sqlalchemy import text

    from staffsync.core.db import session_scope

    async with session_scope(bypass=True) as s:
        await s.execute(text("UPDATE companies SET seat_limit = 1"))
    full = await admin.post("/employees", {"full_name": "Second Person", "employee_no": "E-9", "phone": "+237670000077", "branch_id": ids["branch_id"]})
    assert full.status_code == 422 and full.json()["code"] == "PLAN_LIMIT"


async def test_csv_import_preview_and_commit(client, mailbox):
    admin = await signup_owner(client, mailbox)
    await seed_org(admin)
    csv = "full_name,employee_no,email,phone,branch_code,job_title,start_date,has_smartphone,site_codes\n" \
          "Ann Lee,C-1,ann@example.com,,HQ,Cashier,2026-01-05,true,A\nBad Row,C-2,,,NOPE,,,true,A\nBob Ray,C-3,,+237670000123,HQ,,,false,A\n"
    up = await client.post("/employees/import", headers=admin.headers, files={"file": ("e.csv", csv, "text/csv")})
    assert up.status_code == 201, up.text
    job = up.json()
    assert job["total"] == 3 and [e["row"] for e in job["errors"]] == [3]
    done = (await client.post(f"/employees/import/{job['job_id']}/commit", headers=admin.headers)).json()
    assert done["created"] == 2 and len(done["failed"]) == 1
    assert len((await admin.get("/employees")).json()) == 2


async def test_webhook_signature_and_outbox_relay_and_absence_job(client, mailbox):
    from staffsync.core.db import session_scope
    from staffsync.modules.webhooks.service import sign
    from staffsync.workers import tasks

    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    hook = (await admin.post("/webhooks", {"url": "http://localhost:9/hook", "events": ["attendance.checked_in", "attendance.flagged"]})).json()
    assert hook["secret"].startswith("whsec_")
    emp = await make_employee(admin, mailbox, ids)
    await publish_daily_schedule(admin, ids, [emp.id])
    await emp.post("/attendance/check-in", event("evt-hook-0001", site_id=ids["site_id"], lat=SITE_LAT + 0.01))
    async with session_scope(bypass=True) as s:
        assert await tasks.relay_outbox(s) >= 2
    deliveries = (await admin.get(f"/webhooks/{hook['id']}/deliveries")).json()
    assert {d["event"] for d in deliveries} == {"attendance.checked_in", "attendance.flagged"}
    notes = (await admin.get("/me/notifications")).json()
    assert any(n["type"] == "fraud_flag" for n in notes)  # admins hear about the flag
    assert sign("s", 1, "{}") == sign("s", 1, "{}") and sign("s", 1, "{}") != sign("s", 2, "{}")
    assert (await admin.post("/webhooks", {"url": "ftp://x/y", "events": ["leave.approved"]})).status_code == 400


async def test_absence_detection_marks_no_shows(client, mailbox):
    from staffsync.core.db import session_scope
    from staffsync.workers import tasks

    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = await make_employee(admin, mailbox, ids)
    await publish_daily_schedule(admin, ids, [emp.id], grace=10, started_min_ago=90)  # started 90 min ago, nobody came
    async with session_scope(bypass=True) as s:
        assert await tasks.detect_absences(s) == 1
    async with session_scope(bypass=True) as s:
        assert await tasks.detect_absences(s) == 0  # idempotent
    recs = (await admin.get("/attendance?status=absent")).json()["items"]
    assert len(recs) == 1 and recs[0]["base_status"] == "absent"


async def test_export_formula_injection_neutralised(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = await make_employee(admin, mailbox, ids, name="=HYPERLINK(evil)")
    await publish_daily_schedule(admin, ids, [emp.id])
    await emp.post("/attendance/check-in", event("evt-exp-00001", site_id=ids["site_id"]))
    r = await admin.get("/attendance/export?format=csv")
    assert r.status_code == 200 and "'=HYPERLINK" in r.text and ",=HYPERLINK" not in r.text
    x = await admin.get("/attendance/export?format=xlsx")
    assert x.content[:2] == b"PK"


async def test_ws_ticket_single_use_and_stripe_webhook_signature(client, mailbox):
    import json

    from staffsync.core.config import get_settings

    admin = await signup_owner(client, mailbox)
    t = (await admin.post("/ws/ticket")).json()["ticket"]
    from staffsync.core.redis import get_redis

    assert await get_redis().getdel(f"ws:ticket:{t}") and not await get_redis().getdel(f"ws:ticket:{t}")
    get_settings().stripe_webhook_secret = "whsec_test"
    payload = json.dumps({"id": "evt_1", "object": "event", "type": "invoice.paid", "data": {"object": {"customer": "cus_x", "metadata": {}}}}).encode()
    bad = await client.post("/billing/webhook", content=payload, headers={"Stripe-Signature": "t=1,v1=bad"})
    assert bad.status_code == 400 and bad.json()["code"] == "INVALID_SIGNATURE"
    import hashlib
    import hmac
    import time

    ts = int(time.time())
    sig = hmac.new(b"whsec_test", f"{ts}.".encode() + payload, hashlib.sha256).hexdigest()
    ok = await client.post("/billing/webhook", content=payload, headers={"Stripe-Signature": f"t={ts},v1={sig}"})
    assert ok.status_code == 200 and ok.json()["duplicate"] is False
    dup = await client.post("/billing/webhook", content=payload, headers={"Stripe-Signature": f"t={ts},v1={sig}"})
    assert dup.json()["duplicate"] is True
