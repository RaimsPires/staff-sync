import re
from dataclasses import dataclass, field

import httpx

PASSWORD = "correct-horse-battery"


def last_code(mailbox) -> str:
    for m in reversed(mailbox):
        found = re.search(r"\b(\d{6})\b", m.body)
        if found:
            return found.group(1)
    raise AssertionError("no code sent")


@dataclass
class Admin:
    client: httpx.AsyncClient
    headers: dict
    email: str
    company_id: str
    extra: dict = field(default_factory=dict)

    async def get(self, path, **kw):
        return await self.client.get(path, headers=self.headers, **kw)

    async def post(self, path, json=None, **kw):
        return await self.client.post(path, headers=self.headers, json=json, **kw)

    async def patch(self, path, json=None, **kw):
        return await self.client.patch(path, headers={**self.headers, **kw.pop("headers", {})}, json=json, **kw)

    async def put(self, path, json=None, **kw):
        return await self.client.put(path, headers=self.headers, json=json, **kw)

    async def delete(self, path, json=None):
        return await self.client.request("DELETE", path, headers=self.headers, json=json)


async def signup_owner(client, mailbox, email="owner@example.com", company="Acme") -> Admin:
    r = await client.post("/auth/signup", json={"full_name": "Olive Owner", "email": email, "password": PASSWORD, "company_name": company, "accept_terms": True})
    assert r.status_code == 201, r.text
    r = await client.post("/auth/verify-email", json={"email": email, "code": last_code(mailbox)})
    assert r.status_code == 200, r.text
    tokens = r.json()
    me = await client.get("/me", headers={"authorization": f"Bearer {tokens['access_token']}"})
    return Admin(client, {"authorization": f"Bearer {tokens['access_token']}"}, email, me.json()["company_id"], {"tokens": tokens})


async def seed_org(admin: Admin, *, circle=(9.7679, 4.0511, 150)) -> dict:
    """One branch, one site (circle geofence) -> ids."""
    b = await admin.post("/branches", {"name": "HQ", "code": "HQ"})
    assert b.status_code == 201, b.text
    lng, lat, r = circle
    s = await admin.post("/sites", {"name": "Site A", "code": "A", "branch_id": b.json()["id"], "geofence": {"type": "circle", "center": [lng, lat], "radius_m": r}, "timezone": "Africa/Douala"})
    assert s.status_code == 201, s.text
    return {"branch_id": b.json()["id"], "site_id": s.json()["id"]}


from datetime import datetime, timedelta  # noqa: E402
from zoneinfo import ZoneInfo  # noqa: E402

SITE_LNG, SITE_LAT = 9.7679, 4.0511
TZ = ZoneInfo("Africa/Douala")


@dataclass
class Employee:
    client: httpx.AsyncClient
    headers: dict
    id: str
    device: str = "device-aaaaaaaa"

    async def post(self, path, json=None):
        return await self.client.post(path, headers={**self.headers, "X-Device-Id": self.device}, json=json)

    async def get(self, path, **kw):
        return await self.client.get(path, headers={**self.headers, "X-Device-Id": self.device}, **kw)


async def make_employee(admin: Admin, mailbox, ids: dict, *, phone="+237670000001", name="Emma Employee", no="E-1", smartphone=True, register=True) -> Employee:
    r = await admin.post("/employees", {"full_name": name, "employee_no": no, "phone": phone, "branch_id": ids["branch_id"], "site_ids": [ids["site_id"]], "has_smartphone": smartphone, "send_invite": False})
    assert r.status_code == 201, r.text
    emp_id = r.json()["id"]
    if not smartphone:
        return Employee(admin.client, {}, emp_id)
    mailbox.clear()
    assert (await admin.client.post("/auth/otp/request", json={"identifier": phone})).status_code == 200
    v = await admin.client.post("/auth/otp/verify", json={"identifier": phone, "code": last_code(mailbox)})
    assert v.status_code == 200, v.text
    emp = Employee(admin.client, {"authorization": f"Bearer {v.json()['tokens']['access_token']}"}, emp_id)
    if register:
        d = await emp.post("/devices/register", {"device_id": emp.device, "platform": "android", "model": "Pixel"})
        assert d.status_code == 201, d.text
    return emp


async def publish_daily_schedule(admin: Admin, ids: dict, emp_ids: list[str], *, grace=10, started_min_ago=30) -> str:
    """A 24h-long daily shift that began `started_min_ago` minutes ago, so 'now' is always inside it."""
    start = (datetime.now(TZ) - timedelta(minutes=started_min_ago))
    hhmm = start.strftime("%H:%M")
    r = await admin.post("/schedules", {"type": "recurring", "site_id": ids["site_id"], "title": "Daily", "days_of_week": [0, 1, 2, 3, 4, 5, 6], "start_time": hhmm, "end_time": hhmm,
                                        "crosses_midnight": True, "grace_min": grace, "valid_from": (start.date() - timedelta(days=1)).isoformat(), "employee_ids": emp_ids})
    assert r.status_code == 201, r.text
    p = await admin.post("/schedules/publish", {"schedule_ids": [r.json()["id"]], "notify": False, "confirm_conflicts": True})
    assert p.status_code == 200, p.text
    return r.json()["id"]


def event(eid: str, *, lat=SITE_LAT, lng=SITE_LNG, accuracy=10, at=None, **kw) -> dict:
    return {"client_event_id": eid, "lat": lat, "lng": lng, "accuracy_m": accuracy, "captured_at": (at or datetime.now(TZ)).isoformat(), **kw}
