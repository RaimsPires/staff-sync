from datetime import UTC, date, datetime, timedelta

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
    await publish_daily_schedule(admin, ids, [emp.id], grace=10, started_min_ago=90)
    # look at the clock two hours later, so the shift is long past its start whatever time of day the test runs
    later = datetime.now(UTC) + timedelta(hours=2)
    async with session_scope(bypass=True) as s:
        assert await tasks.detect_absences(s, now=later) == 1
    async with session_scope(bypass=True) as s:
        assert await tasks.detect_absences(s, now=later) == 0  # idempotent
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


async def _planner(admin) -> list[dict]:
    now = datetime.now(TZ)
    r = await admin.get("/shifts", params={"from": (now - timedelta(days=2)).isoformat(), "to": (now + timedelta(days=3)).isoformat()})
    assert r.status_code == 200, r.text
    return r.json()


async def test_draft_schedule_shows_in_the_planner_but_not_to_employees_until_published(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = await make_employee(admin, mailbox, ids)
    start = datetime.now(TZ) - timedelta(minutes=30)
    hhmm = start.strftime("%H:%M")
    body = {"type": "recurring", "site_id": ids["site_id"], "title": "Daily", "days_of_week": [0, 1, 2, 3, 4, 5, 6], "start_time": hhmm, "end_time": hhmm, "crosses_midnight": True,
            "valid_from": (start.date() - timedelta(days=1)).isoformat(), "employee_ids": [emp.id]}
    created = await admin.post("/schedules", body)
    assert created.status_code == 201, created.text

    shifts = await _planner(admin)
    assert shifts and {s["status"] for s in shifts} == {"draft"}
    assert (await emp.get("/me/shifts/today")).json() == []  # employees do not see drafts
    live = (await admin.get("/attendance/live")).json()
    assert all(site["rows"] == [] for site in live)  # nor does the live board

    assert (await admin.post("/schedules/publish", {"schedule_ids": [created.json()["id"]], "notify": False, "confirm_conflicts": True})).status_code == 200
    assert {s["status"] for s in await _planner(admin)} == {"scheduled"}
    assert len((await emp.get("/me/shifts/today")).json()) == 1


async def test_a_single_shift_can_be_reassigned_and_cancelled(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    first = await make_employee(admin, mailbox, ids)
    second = await make_employee(admin, mailbox, ids, phone="+237670000002", name="Sam Second", no="E-2")
    await publish_daily_schedule(admin, ids, [first.id])
    shift = (await _planner(admin))[0]
    assert shift["employee_id"] == first.id

    moved = await admin.patch(f"/shifts/{shift['id']}", {"employee_id": second.id, "notify": False})
    assert moved.status_code == 200, moved.text
    assert moved.json()["employee_id"] == second.id
    assert len((await second.get("/me/shifts/today")).json()) == 1 and (await first.get("/me/shifts/today")).json() == []

    assert (await admin.delete(f"/shifts/{shift['id']}", {"reason": "not needed"})).status_code == 204
    assert all(s["id"] != shift["id"] for s in await _planner(admin))
    assert (await second.get("/me/shifts/today")).json() == []


async def test_a_shift_with_a_check_in_cannot_be_reassigned_or_cancelled(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    first = await make_employee(admin, mailbox, ids)
    second = await make_employee(admin, mailbox, ids, phone="+237670000002", name="Sam Second", no="E-2")
    await publish_daily_schedule(admin, ids, [first.id])
    assert (await first.post("/attendance/check-in", event("evt-draft-0001"))).status_code == 200
    shift = next(s for s in await _planner(admin) if s["employee_id"] == first.id)
    assert (await admin.patch(f"/shifts/{shift['id']}", {"employee_id": second.id})).status_code == 422
    assert (await admin.delete(f"/shifts/{shift['id']}", {"reason": "nope nope"})).status_code == 422


async def test_report_preview_filters_by_employee_and_branch(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    first = await make_employee(admin, mailbox, ids)
    second = await make_employee(admin, mailbox, ids, phone="+237670000002", name="Sam Second", no="E-2")
    await publish_daily_schedule(admin, ids, [first.id, second.id])
    assert (await first.post("/attendance/check-in", event("evt-report-0001"))).status_code == 200
    assert (await second.post("/attendance/check-in", event("evt-report-0002"))).status_code == 200
    today = datetime.now(TZ).date().isoformat()
    base = {"type": "timesheet", "date_from": today, "date_to": today, "group_by": "employee"}

    everyone = (await admin.post("/reports/preview", base)).json()
    assert {r["label"] for r in everyone["rows"]} == {"Emma Employee", "Sam Second"}

    only_first = (await admin.post("/reports/preview", {**base, "employee_ids": [first.id]})).json()
    assert [r["label"] for r in only_first["rows"]] == ["Emma Employee"]

    other_branch = (await admin.post("/reports/preview", {**base, "branch_ids": ["00000000-0000-0000-0000-000000000001"]})).json()
    assert other_branch["rows"] == []
    in_branch = (await admin.post("/reports/preview", {**base, "branch_ids": [ids["branch_id"]]})).json()
    assert len(in_branch["rows"]) == 2


async def test_a_revoked_dashboard_user_stays_listed_and_can_be_restored(client, mailbox):
    admin = await signup_owner(client, mailbox)
    viewer = next(r for r in (await admin.get("/roles")).json() if r["key"] == "viewer")
    invited = await admin.post("/users/invite", {"email": "hr@example.com", "full_name": "Hana Resources", "role_id": viewer["id"], "scope_type": "company", "scope_ids": []})
    assert invited.status_code == 201, invited.text
    user_id = next(u["id"] for u in (await admin.get("/users")).json() if u["email"] == "hr@example.com")

    assert (await admin.post(f"/users/{user_id}/revoke")).status_code == 204
    listed = {u["email"]: u for u in (await admin.get("/users")).json()}
    assert listed["hr@example.com"]["status"] == "revoked" and listed["hr@example.com"]["roles"] == []

    restored = await admin.post(f"/users/{user_id}/restore", {"role_id": viewer["id"], "scope_type": "company", "scope_ids": []})
    assert restored.status_code == 204, restored.text
    back = {u["email"]: u for u in (await admin.get("/users")).json()}["hr@example.com"]
    assert back["status"] == "active" and back["roles"][0]["role"] == viewer["name"]
    assert (await admin.post(f"/users/{user_id}/restore", {"role_id": viewer["id"], "scope_type": "company", "scope_ids": []})).status_code == 404  # no longer revoked


async def test_resending_an_invitation_replaces_the_old_link(client, mailbox):
    admin = await signup_owner(client, mailbox)
    viewer = next(r for r in (await admin.get("/roles")).json() if r["key"] == "viewer")
    assert (await admin.post("/users/invite", {"email": "ops@example.com", "full_name": "Ops Person", "role_id": viewer["id"], "scope_type": "company", "scope_ids": []})).status_code == 201
    user_id = next(u["id"] for u in (await admin.get("/users")).json() if u["email"] == "ops@example.com")
    assert (await admin.post(f"/users/{user_id}/resend-invite")).status_code == 204
    assert len([m for m in mailbox if m.to == "ops@example.com"]) == 2
    unknown = "00000000-0000-0000-0000-000000000000"
    assert (await admin.post(f"/users/{unknown}/resend-invite")).status_code == 404


async def test_leave_edit_keeps_attachments_when_field_omitted(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = await make_employee(admin, mailbox, ids)
    lt = await leave_type(admin)
    mon = next_monday()
    draft = {"leave_type_id": lt, "start_date": mon.isoformat(), "end_date": mon.isoformat(), "attachment_keys": ["k1"]}
    req = (await emp.post("/me/leave/requests", draft)).json()
    omitted = {k: v for k, v in draft.items() if k != "attachment_keys"}
    kept = await emp.patch(f"/me/leave/requests/{req['id']}", {**omitted, "reason": "updated"})
    assert kept.status_code == 200 and kept.json()["attachment_keys"] == ["k1"]
    cleared = await emp.patch(f"/me/leave/requests/{req['id']}", {**omitted, "attachment_keys": ["k2"]})
    assert cleared.json()["attachment_keys"] == ["k2"]


async def test_managing_a_site_grants_and_removes_the_site_manager_role(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    mgr = await make_employee(admin, mailbox, ids, phone="+237670000009", name="Mia Manager", no="M-1")
    uid = (await mgr.get("/me")).json()["id"]
    roles_of = lambda me: set(me["roles"])  # noqa: E731
    assert "Site manager" not in roles_of((await mgr.get("/me")).json())
    assert (await admin.put(f"/sites/{ids['site_id']}/managers", {"ids": [uid]})).status_code == 200
    assert "Site manager" in roles_of((await mgr.get("/me")).json())
    # unassigning takes the role back
    assert (await admin.put(f"/sites/{ids['site_id']}/managers", {"ids": []})).status_code == 200
    assert "Site manager" not in roles_of((await mgr.get("/me")).json())


async def test_archived_branch_can_be_restored(client, mailbox):
    admin = await signup_owner(client, mailbox)
    b = (await admin.post("/branches", {"name": "Spare", "code": "SP"})).json()
    arch = await admin.post(f"/branches/{b['id']}/archive")
    assert arch.status_code == 200 and arch.json()["status"] == "archived"
    back = await admin.post(f"/branches/{b['id']}/restore")
    assert back.status_code == 200 and back.json()["status"] == "active"
    # a branch that is not archived or deleted has nothing to restore
    assert (await admin.post(f"/branches/{b['id']}/restore")).status_code == 409


async def test_roster_shows_a_note_left_on_the_employee_today(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = await make_employee(admin, mailbox, ids)
    await publish_daily_schedule(admin, ids, [emp.id])
    live = (await admin.get("/attendance/live", params={"site_id": ids["site_id"]})).json()[0]
    assert live["rows"][0]["note"] is None
    assert (await admin.post(f"/employees/{emp.id}/notes", {"body": "wrong badge, checked by hand"})).status_code == 201
    live = (await admin.get("/attendance/live", params={"site_id": ids["site_id"]})).json()[0]
    assert live["rows"][0]["note"] == "wrong badge, checked by hand"


async def test_site_manager_can_recommend_under_one_level_approval(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = await make_employee(admin, mailbox, ids)
    lt = await leave_type(admin)
    mon = next_monday()
    req = (await emp.post("/me/leave/requests", {"leave_type_id": lt, "start_date": mon.isoformat(), "end_date": mon.isoformat()})).json()
    assert req["status"] == "pending"
    # the default policy has one approval level; the recommendation is advice and the request stays with the approver
    rec = await admin.post(f"/leave/requests/{req['id']}/recommend", {"decision": "approve", "comment": "covered that day"})
    assert rec.status_code == 200 and rec.json()["status"] == "pending"
    assert rec.json()["recommendation"] == "approve"
    rej = await admin.post(f"/leave/requests/{req['id']}/recommend", {"decision": "reject", "comment": "short staffed"})
    assert rej.status_code == 200 and rej.json()["status"] == "pending" and rej.json()["recommendation"] == "reject"
    tl = (await admin.get(f"/leave/requests/{req['id']}")).json()["request"]["timeline"]
    assert [t["action"] for t in tl].count("recommended") == 2
    assert (await admin.post(f"/leave/requests/{req['id']}/approve", {"comment": "ok"})).json()["status"] == "approved"
    # once decided there is nothing left to recommend on
    assert (await admin.post(f"/leave/requests/{req['id']}/recommend", {"decision": "approve", "comment": "late"})).status_code == 409


async def test_local_storage_round_trip_through_signed_urls(client, mailbox, tmp_path, monkeypatch):
    from staffsync.core.config import get_settings

    monkeypatch.setattr(get_settings(), "local_storage_dir", str(tmp_path))
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = await make_employee(admin, mailbox, ids)
    target = (await emp.post("/uploads/leave-attachment", {"content_type": "image/png", "size_bytes": 12})).json()
    assert target["method"] == "PUT" and "/files/" in target["url"]
    path = target["url"].split("/api/v1", 1)[1]
    # the wrong content type and a tampered token are refused
    assert (await client.put(path, content=b"x", headers={"content-type": "image/jpeg"})).status_code == 400
    assert (await client.put(path[:-3] + "abc", content=b"x", headers={"content-type": "image/png"})).status_code == 401
    assert (await client.put(path, content=b"\x89PNG-bytes!", headers={"content-type": "image/png"})).status_code == 204
    # a download URL for the stored key serves the same bytes; an upload URL cannot be used to read
    from staffsync.core.adapters import get_storage

    url = (await get_storage().presign_get(target["key"])).split("/api/v1", 1)[1]
    got = await client.get(url)
    assert got.status_code == 200 and got.content == b"\x89PNG-bytes!" and got.headers["content-type"] == "image/png"
    assert (await client.get(path)).status_code == 404
