"""Sweeps every route: anonymous callers get 401; a plain employee gets 403/404 on every admin route."""

import re
import uuid

from tests.helpers import make_employee, seed_org, signup_owner

PUBLIC = re.compile(r"^/api/v1/(auth/|invitations/|\.well-known|health/|billing/webhook|files/)")
# endpoints any signed-in member may call (scoped to their own data or harmless)
MEMBER_OK = re.compile(r"^/api/v1/(me|devices|uploads|chat/|attendance/(check-in|check-out|sync)|company$|company/onboarding|org/tree|search|leave/types$|billing/plans|ws/|auth)")


def routes():
    from staffsync.main import app

    for path, ops in app.openapi()["paths"].items():
        for method in ops:
            if method.upper() in {"GET", "POST", "PUT", "PATCH", "DELETE"}:
                yield method.upper(), path


def concrete(path: str) -> str:
    return re.sub(r"\{[^}]+\}", lambda m: str(uuid.uuid4()) if "id" in m.group(0) or "token" not in m.group(0) else "tok", path)


ALL = sorted(set(routes()))
assert len(ALL) > 150, len(ALL)  # guards against the sweep silently covering nothing


async def test_anonymous_requests_are_rejected_everywhere(client):
    leaks = []
    for method, path in ALL:
        if PUBLIC.match(path) or path.endswith("/jwks.json"):
            continue
        r = await client.request(method, concrete(path).removeprefix("/api/v1"), json={})
        if r.status_code != 401:
            leaks.append((method, path, r.status_code))
    assert not leaks, leaks


async def test_plain_employee_cannot_use_admin_routes(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = await make_employee(admin, mailbox, ids)
    leaks = []
    for method, path in ALL:
        if PUBLIC.match(path) or MEMBER_OK.match(path):
            continue
        r = await emp.client.request(method, concrete(path).removeprefix("/api/v1"), headers=emp.headers, json={})
        if r.status_code not in (403, 404):
            leaks.append((method, path, r.status_code))
    assert not leaks, leaks


async def test_other_tenant_admin_sees_nothing(client, mailbox):
    a = await signup_owner(client, mailbox, "a@example.com", "A Corp")
    ids = await seed_org(a)
    emp = await make_employee(a, mailbox, ids)
    b = await signup_owner(client, mailbox, "b@example.com", "B Corp")
    for path in (f"/employees/{emp.id}", f"/branches/{ids['branch_id']}", f"/sites/{ids['site_id']}", f"/employees/{emp.id}/device", f"/employees/{emp.id}/attendance?month=2026-10"):
        assert (await b.get(path)).status_code == 404, path
    assert (await b.get("/employees")).json() == []
    assert (await b.patch(f"/sites/{ids['site_id']}", {"name": "Hijacked"})).status_code == 404
