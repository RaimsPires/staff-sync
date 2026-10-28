"""Temporary passwords: how new employees and invited dashboard users first get in."""

import re
from datetime import UTC, datetime, timedelta

from sqlalchemy import update

from staffsync.core.db import session_scope
from staffsync.modules.auth.models import Invitation
from tests.helpers import last_code, seed_org, signup_owner


async def hire(admin, ids, mailbox, *, no, email=None, phone=None, name="Eva Employee", invite=True, smartphone=True):
    mailbox.clear()
    body = {"full_name": name, "employee_no": no, "branch_id": ids["branch_id"], "site_ids": [ids["site_id"]], "has_smartphone": smartphone, "send_invite": invite}
    if email:
        body["email"] = email
    if phone:
        body["phone"] = phone
    return await admin.post("/employees", body)


def temp_password(message) -> str:
    found = re.search(r"temporary password: (\S+?)\.", message.body)
    assert found, message.body
    return found.group(1)


async def mobile_sign_in(client, mailbox, who, password):
    """Password, then the code that arrives by e-mail (or SMS). Returns the verify response."""
    mailbox.clear()
    r = await client.post("/auth/otp/request", json={"identifier": who, "password": password})
    assert r.status_code == 200, r.text
    return await client.post("/auth/otp/verify", json={"identifier": who, "code": last_code(mailbox)})


async def test_a_new_employee_is_mailed_a_temporary_password_and_must_replace_it(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    created = await hire(admin, ids, mailbox, no="E-1", email="eva@example.com", phone="+237670000101")
    assert created.status_code == 201
    assert "password" not in created.text.lower()  # the password only travels by e-mail or SMS
    mails = [m for m in mailbox if m.channel == "email"]
    assert [m.to for m in mails] == ["eva@example.com"] and not any(m.channel == "sms" for m in mailbox)
    temp = temp_password(mails[0])
    assert len(temp) == 12 and "Eva" not in mails[0].body.replace("Eva Employee", "")  # no name in the password, obviously
    # phone + temporary password + code: signed in, but told to choose a password
    v = await mobile_sign_in(client, mailbox, "+237670000101", temp)
    assert v.status_code == 200 and v.json()["needs_password"] is True
    h = {"authorization": f"Bearer {v.json()['tokens']['access_token']}"}
    assert (await client.post("/me/password/initial", headers=h, json={"new_password": temp})).status_code == 400  # not the same one
    assert (await client.post("/me/password/initial", headers=h, json={"new_password": "My-own-password-77"})).status_code == 204
    assert (await client.post("/me/password/initial", headers=h, json={"new_password": "Another-password-88"})).status_code == 409  # only once
    # the temporary one is dead, the new one works and no longer asks for a change
    assert (await client.post("/auth/otp/request", json={"identifier": "eva@example.com", "password": temp})).status_code == 401
    again = await mobile_sign_in(client, mailbox, "eva@example.com", "My-own-password-77")
    assert again.status_code == 200 and again.json()["needs_password"] is False


async def test_without_an_email_the_temporary_password_goes_by_sms(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    assert (await hire(admin, ids, mailbox, no="E-2", phone="+237670000102")).status_code == 201
    assert [m.channel for m in mailbox] == ["sms"] and mailbox[0].to == "+237670000102"
    v = await mobile_sign_in(client, mailbox, "+237670000102", temp_password(mailbox[0]))
    assert v.status_code == 200 and v.json()["needs_password"] is True


async def test_no_password_is_issued_without_an_invitation_or_for_staff_without_a_phone(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    await hire(admin, ids, mailbox, no="E-3", email="quiet@example.com", invite=False)
    assert list(mailbox) == []
    await hire(admin, ids, mailbox, no="E-4", email="badge@example.com", name="Badge Person", smartphone=False)
    assert list(mailbox) == []
    nobody = await client.post("/auth/otp/request", json={"identifier": "quiet@example.com"})
    assert nobody.status_code == 200 and nobody.json()["password_setup_required"] is True  # still no password: code-only first sign-in


async def test_an_existing_account_is_found_by_email_first_and_keeps_its_password(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    viewer = next(r for r in (await admin.get("/roles")).json() if r["key"] == "viewer")
    mailbox.clear()
    await admin.post("/users/invite", {"email": "hana@example.com", "full_name": "Hana HR", "role_id": viewer["id"], "scope_type": "company", "scope_ids": []})
    token = re.search(r"/invite/([A-Za-z0-9_-]+)", mailbox[-1].body).group(1)
    assert (await client.post(f"/invitations/{token}/accept", json={"password": "Hana-own-password-1", "full_name": "Hana HR"})).status_code == 200
    before = len((await admin.get("/users")).json())
    # Hana becomes an employee too, with a phone number nobody has used: same person, same account, same password
    created = await hire(admin, ids, mailbox, no="E-5", email="hana@example.com", phone="+237670000105", name="Hana HR")
    assert created.status_code == 201
    assert len((await admin.get("/users")).json()) == before  # no second account
    assert not any("temporary password" in m.body for m in mailbox)  # a plain invitation: she already has a password
    assert (await client.post("/auth/login", json={"email": "hana@example.com", "password": "Hana-own-password-1"})).status_code == 200
    # her account now also answers to the new phone number (the blank was filled)
    assert (await client.post("/auth/otp/request", json={"identifier": "+237670000105", "password": "Hana-own-password-1"})).status_code == 200


async def test_the_dashboard_accepts_the_temporary_password_and_forces_a_change(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    await hire(admin, ids, mailbox, no="E-6", email="web@example.com", phone="+237670000106")
    temp = temp_password(mailbox[0])
    login = await client.post("/auth/login", json={"email": "web@example.com", "password": temp})
    assert login.status_code == 200 and login.json()["must_change_password"] is True
    h = {"authorization": f"Bearer {login.json()['tokens']['access_token']}"}
    assert (await client.post("/me/password/initial", headers=h, json={"new_password": "Dashboard-own-pass-9"})).status_code == 204
    after = await client.post("/auth/login", json={"email": "web@example.com", "password": "Dashboard-own-pass-9"})
    assert after.status_code == 200 and after.json()["must_change_password"] is False


async def test_resending_gives_a_fresh_temporary_password_until_the_person_chooses_their_own(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    emp = (await hire(admin, ids, mailbox, no="E-7", email="again@example.com", phone="+237670000107")).json()
    first = temp_password(mailbox[0])
    mailbox.clear()
    assert (await admin.post(f"/employees/{emp['id']}/invite", {})).status_code == 202
    second = temp_password(mailbox[0])
    assert second != first
    assert (await client.post("/auth/login", json={"email": "again@example.com", "password": first})).status_code == 401  # replaced
    login = await client.post("/auth/login", json={"email": "again@example.com", "password": second})
    h = {"authorization": f"Bearer {login.json()['tokens']['access_token']}"}
    assert (await client.post("/me/password/initial", headers=h, json={"new_password": "Chosen-by-the-person-1"})).status_code == 204
    mailbox.clear()
    assert (await admin.post(f"/employees/{emp['id']}/invite", {})).status_code == 202
    assert "temporary password" not in mailbox[0].body  # they have their own password now: only a reminder


async def test_an_invited_dashboard_user_gets_a_link_and_a_temporary_password(client, mailbox):
    admin = await signup_owner(client, mailbox)
    viewer = next(r for r in (await admin.get("/roles")).json() if r["key"] == "viewer")

    async def invite(email):
        mailbox.clear()
        r = await admin.post("/users/invite", {"email": email, "full_name": "New Admin", "role_id": viewer["id"], "scope_type": "company", "scope_ids": []})
        assert r.status_code == 201, r.text
        return mailbox[-1]

    # path 1: sign in with the temporary password without opening the link
    mail = await invite("nora@example.com")
    assert "/invite/" in mail.body and "temporary password" in mail.body
    temp = re.search(r"temporary password: (\S+)", mail.body).group(1)
    login = await client.post("/auth/login", json={"email": "nora@example.com", "password": temp})
    assert login.status_code == 200 and login.json()["must_change_password"] is True and login.json()["companies"]
    token = re.search(r"/invite/([A-Za-z0-9_-]+)", mail.body).group(1)
    assert (await client.get(f"/invitations/{token}")).status_code == 404  # signing in accepted the invitation, the link is used up
    h = {"authorization": f"Bearer {login.json()['tokens']['access_token']}"}
    assert (await client.post("/me/password/initial", headers=h, json={"new_password": "Nora-own-password-3"})).status_code == 204

    # path 2: open the link and choose a password: no forced change afterwards
    mail = await invite("omar@example.com")
    link = re.search(r"/invite/([A-Za-z0-9_-]+)", mail.body).group(1)
    assert (await client.post(f"/invitations/{link}/accept", json={"password": "Omar-own-password-4", "full_name": "Omar"})).status_code == 200
    omar = await client.post("/auth/login", json={"email": "omar@example.com", "password": "Omar-own-password-4"})
    assert omar.status_code == 200 and omar.json()["must_change_password"] is False
    old_temp = re.search(r"temporary password: (\S+)", mail.body).group(1)
    assert (await client.post("/auth/login", json={"email": "omar@example.com", "password": old_temp})).status_code == 401

    # an expired invitation takes its temporary password with it; resending issues a new pair
    mail = await invite("paula@example.com")
    temp = re.search(r"temporary password: (\S+)", mail.body).group(1)
    async with session_scope(bypass=True) as s:
        await s.exec(update(Invitation).values(expires_at=datetime.now(UTC) - timedelta(days=1)))  # type: ignore[arg-type]
    expired = await client.post("/auth/login", json={"email": "paula@example.com", "password": temp})
    assert expired.status_code == 403 and expired.json()["code"] == "INVITE_EXPIRED"
    user_id = next(u["id"] for u in (await admin.get("/users")).json() if u.get("email") == "paula@example.com")
    mailbox.clear()
    assert (await admin.post(f"/users/{user_id}/resend-invite", {})).status_code == 204
    fresh = re.search(r"temporary password: (\S+)", mailbox[-1].body).group(1)
    assert fresh != temp
    assert (await client.post("/auth/login", json={"email": "paula@example.com", "password": temp})).status_code == 401
    assert (await client.post("/auth/login", json={"email": "paula@example.com", "password": fresh})).status_code == 200


async def test_a_person_who_already_has_a_password_gets_only_the_link_when_invited(client, mailbox):
    admin = await signup_owner(client, mailbox)
    viewer = next(r for r in (await admin.get("/roles")).json() if r["key"] == "viewer")
    mailbox.clear()
    await admin.post("/users/invite", {"email": "owner@example.com", "full_name": "Owner", "role_id": viewer["id"], "scope_type": "company", "scope_ids": []})
    # the owner already exists with a password: a second invitation must not touch it
    assert not any("temporary password" in m.body for m in mailbox)
    assert (await client.post("/auth/login", json={"email": "owner@example.com", "password": "correct-horse-battery"})).status_code == 200
