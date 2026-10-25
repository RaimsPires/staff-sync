"""Seed the dev database with a demo company so admin and mobile have something real to show.

Runs the app in-process (like the tests do), so the OTP / verification codes can be read from the
console notifier. Re-running is safe: it stops if the demo owner already exists.

    uv run python scripts/seed_dev.py
"""

import asyncio
import re
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import httpx

from staffsync.core.adapters import get_notifier
from staffsync.main import app

OWNER_EMAIL = "owner@staffsync.app"
OWNER_PASSWORD = "staffsync-demo-1"
TZ = ZoneInfo("Africa/Douala")
SITE_A = (9.7679, 4.0511)  # lng, lat (Bonanjo, Douala)
SITE_B = (9.7043, 4.0483)  # lng, lat (Akwa)

EMPLOYEES = [
    # name, no, phone, site key
    ("Amina Nkodo", "E-001", "+2250712345678", "a"),
    ("Joseph Ewane", "E-002", "+237670000002", "a"),
    ("Paul Mbella", "E-003", "+237670000003", "b"),
    ("Grace Tabi", "E-004", "+237670000004", "b"),
]
MANAGER = ("Karim Mbarga", "M-001", "+2250511223344", "a")


def last_code(mailbox: list) -> str:
    for m in reversed(mailbox):
        found = re.search(r"\b(\d{6})\b", m.body)
        if found:
            return found.group(1)
    raise RuntimeError("no code was sent")


async def main() -> None:
    notifier = get_notifier()
    notifier.providers.clear()  # the demo people have made-up addresses: read their codes from memory, never send for real
    mailbox = notifier.console.sent
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://seed/api/v1") as c:
        r = await c.post("/auth/signup", json={"full_name": "Claire Vasseur", "email": OWNER_EMAIL, "password": OWNER_PASSWORD, "company_name": "Demo Logistics", "accept_terms": True})
        if r.status_code != 201:
            print(f"signup refused ({r.status_code}): {r.text}\nDemo owner probably exists already; run `make reset` to start over.")
            return
        v = await c.post("/auth/verify-email", json={"email": OWNER_EMAIL, "code": last_code(mailbox)})
        v.raise_for_status()
        h = {"authorization": f"Bearer {v.json()['access_token']}"}

        async def post(path, body=None):
            res = await c.post(path, headers=h, json=body)
            assert res.status_code < 300, f"POST {path} -> {res.status_code} {res.text}"
            return res.json() if res.content else None

        branch = await post("/branches", {"name": "Douala HQ", "code": "DLA"})
        sites = {}
        for key, name, code, (lng, lat) in (("a", "Bonanjo Tower", "BON", SITE_A), ("b", "Akwa Warehouse", "AKW", SITE_B)):
            geofence = {"type": "circle", "center": [lng, lat], "radius_m": 150}
            sites[key] = (await post("/sites", {"name": name, "code": code, "branch_id": branch["id"], "geofence": geofence, "timezone": "Africa/Douala", "address": f"{name}, Douala"}))["id"]

        for en, fr, days, doc in (("Annual leave", "Congé annuel", 24, False), ("Sick leave", "Congé maladie", 10, True), ("Unpaid leave", "Congé sans solde", 0, False)):
            await post("/leave/types", {"name_en": en, "name_fr": fr, "yearly_allowance": days, "requires_document": doc, "paid": days > 0})

        employees: dict[str, dict] = {}
        for name, no, phone, site in [*EMPLOYEES, MANAGER]:
            employees[no] = await post("/employees", {"full_name": name, "employee_no": no, "phone": phone, "branch_id": branch["id"], "site_ids": [sites[site]], "has_smartphone": True, "send_invite": False})

        # The manager needs a user row to manage a site: an OTP login creates it (no device registered, the phone does that).
        mailbox.clear()
        await c.post("/auth/otp/request", json={"identifier": MANAGER[2]})
        await c.post("/auth/otp/verify", json={"identifier": MANAGER[2], "code": last_code(mailbox)})
        mgr = await c.get(f"/employees/{employees[MANAGER[1]]['id']}", headers=h)
        await c.put(f"/sites/{sites['a']}/managers", headers=h, json={"ids": [mgr.json()["user_id"]]})

        # One all-day schedule per site, from yesterday, so "now" is always inside a shift.
        start = datetime.now(TZ).replace(hour=8, minute=0)
        for key in ("a", "b"):
            ids = [e["id"] for e in employees.values() if e["site_ids"] == [sites[key]]]
            sched = await post("/schedules", {"type": "recurring", "site_id": sites[key], "title": "Day shift", "days_of_week": [0, 1, 2, 3, 4, 5, 6], "start_time": "08:00", "end_time": "17:00",
                                              "crosses_midnight": False, "grace_min": 10, "valid_from": (start.date() - timedelta(days=1)).isoformat(), "employee_ids": ids})
            await post("/schedules/publish", {"schedule_ids": [sched["id"]], "notify": False, "confirm_conflicts": True})

    print("\nSeeded demo company 'Demo Logistics'\n")
    print(f"  Admin (web)    {OWNER_EMAIL} / {OWNER_PASSWORD}")
    print("  Employees (mobile, OTP is printed in the API log):")
    for name, no, phone, site in [*EMPLOYEES, MANAGER]:
        print(f"    {name:<14} {phone}  {'(site manager)' if no == MANAGER[1] else ''}")
    print("  Sites: Bonanjo Tower (9.7679, 4.0511), Akwa Warehouse (9.7043, 4.0483), 150 m circles")


if __name__ == "__main__":
    asyncio.run(main())
