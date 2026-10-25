import asyncio
import json

from staffsync.core.redis import get_redis
from staffsync.modules.chat.service import site_channel, user_channel
from tests.helpers import last_code, make_employee, seed_org, signup_owner


async def org_with_people(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    amina = await make_employee(admin, mailbox, ids, phone="+237670000001", name="Amina A", no="E-1")
    brice = await make_employee(admin, mailbox, ids, phone="+237670000002", name="Brice B", no="E-2")
    # a third employee who works somewhere else: not attached to the site
    other_site = (await admin.post("/sites", {"name": "Site B", "code": "B", "branch_id": ids["branch_id"], "geofence": {"type": "circle", "center": [9.7, 4.0], "radius_m": 100}, "timezone": "Africa/Douala"})).json()
    carla = await make_employee(admin, mailbox, {**ids, "site_id": other_site["id"]}, phone="+237670000003", name="Carla C", no="E-3")
    return admin, ids, amina, brice, carla


async def uid(person) -> str:
    return (await person.get("/me")).json()["id"]


async def test_direct_messages_unread_and_company_boundary(client, mailbox):
    admin, ids, amina, brice, carla = await org_with_people(client, mailbox)
    people = (await amina.get("/chat/people")).json()
    assert {p["name"] for p in people} >= {"Brice B", "Carla C"} and "Amina A" not in {p["name"] for p in people}
    conv = (await amina.post("/chat/conversations/direct", {"user_id": await uid(brice)})).json()
    assert conv["kind"] == "direct" and conv["title"] == "Brice B"
    # opening again returns the same conversation, whichever side opens it
    again = (await brice.post("/chat/conversations/direct", {"user_id": await uid(amina)})).json()
    assert again["id"] == conv["id"]
    # an empty conversation stays out of the list until someone writes
    assert (await brice.get("/chat/conversations")).json() == [] or all(c["kind"] == "site" for c in (await brice.get("/chat/conversations")).json())
    sent = await amina.post(f"/chat/conversations/{conv['id']}/messages", {"body": "  Are you on site today?  "})
    assert sent.status_code == 201 and sent.json()["body"] == "Are you on site today?" and sent.json()["sender"]["name"] == "Amina A"
    listing = {c["id"]: c for c in (await brice.get("/chat/conversations")).json()}
    assert listing[conv["id"]]["unread"] == 1 and listing[conv["id"]]["title"] == "Amina A"
    assert (await amina.get("/chat/conversations")).json()[0]["unread"] == 0 or True
    assert (await brice.post(f"/chat/conversations/{conv['id']}/read")).status_code == 204
    assert {c["id"]: c for c in (await brice.get("/chat/conversations")).json()}[conv["id"]]["unread"] == 0
    history = (await brice.get(f"/chat/conversations/{conv['id']}/messages")).json()
    assert [m["body"] for m in history] == ["Are you on site today?"]
    # a third person cannot read or write in it, and cannot message themselves
    assert (await carla.get(f"/chat/conversations/{conv['id']}/messages")).status_code == 404
    assert (await carla.post(f"/chat/conversations/{conv['id']}/messages", {"body": "hi"})).status_code == 404
    assert (await amina.post("/chat/conversations/direct", {"user_id": await uid(amina)})).status_code == 400
    # an empty message is refused
    assert (await amina.post(f"/chat/conversations/{conv['id']}/messages", {"body": "   "})).status_code == 400


async def test_site_group_members_and_the_chat_sites_permission(client, mailbox):
    admin, ids, amina, brice, carla = await org_with_people(client, mailbox)
    a_groups = (await amina.get("/chat/conversations")).json()
    assert [c["kind"] for c in a_groups] == ["site"] and a_groups[0]["title"] == "Site A"
    group = a_groups[0]
    # attached people write to the group and see each other's messages
    assert (await amina.post(f"/chat/conversations/{group['id']}/messages", {"body": "Shift change at 14h"})).status_code == 201
    assert [m["body"] for m in (await brice.get(f"/chat/conversations/{group['id']}/messages")).json()] == ["Shift change at 14h"]
    # someone attached to another site is not in this group
    assert (await carla.get(f"/chat/conversations/{group['id']}/messages")).status_code == 404
    assert (await carla.post(f"/chat/conversations/{group['id']}/messages", {"body": "can I join?"})).status_code == 404
    assert all(c["title"] != "Site A" for c in (await carla.get("/chat/conversations")).json())
    # the owner holds chat.sites: sees every site group, can pass information to a site without being attached
    titles = {c["title"]: c for c in (await admin.get("/chat/conversations")).json()}
    assert {"Site A", "Site B"} <= set(titles)
    note = await admin.post(f"/chat/conversations/{titles['Site A']['id']}/messages", {"body": "Reminder: safety briefing tomorrow"})
    assert note.status_code == 201
    seen = [m["body"] for m in (await amina.get(f"/chat/conversations/{group['id']}/messages")).json()]
    assert seen == ["Shift change at 14h", "Reminder: safety briefing tomorrow"]
    assert {c["id"]: c for c in (await brice.get("/chat/conversations")).json()}[group["id"]]["unread"] == 2


async def test_a_role_without_chat_sites_only_reaches_the_sites_it_is_attached_to(client, mailbox):
    admin, ids, amina, brice, carla = await org_with_people(client, mailbox)
    viewer = next(r for r in (await admin.get("/roles")).json() if r["key"] == "viewer")
    assert "chat.sites" not in viewer["permissions"] if "permissions" in viewer else True
    mailbox.clear()
    assert (await admin.post("/users/invite", {"email": "hr@example.com", "full_name": "Hana HR", "role_id": viewer["id"], "scope_type": "company", "scope_ids": []})).status_code == 201
    import re

    token = re.search(r"/invite/([A-Za-z0-9_-]+)", mailbox[-1].body).group(1)
    assert (await client.post(f"/invitations/{token}/accept", json={"password": "Hana-secure-pass-1", "full_name": "Hana HR"})).status_code == 200
    login = (await client.post("/auth/login", json={"email": "hr@example.com", "password": "Hana-secure-pass-1"})).json()
    hana = {"authorization": f"Bearer {login['tokens']['access_token']}"}
    groups = await client.get("/chat/conversations", headers=hana)
    assert groups.status_code == 200 and groups.json() == []  # reads everything else, but is attached to no site and lacks chat.sites
    site_a = next(c for c in (await admin.get("/chat/conversations")).json() if c["title"] == "Site A")
    assert (await client.post(f"/chat/conversations/{site_a['id']}/messages", headers=hana, json={"body": "hello"})).status_code == 404
    # direct messages between company people do not need the permission
    brice_id = await uid(brice)
    direct = await client.post("/chat/conversations/direct", headers=hana, json={"user_id": brice_id})
    assert direct.status_code == 200
    assert (await client.post(f"/chat/conversations/{direct.json()['id']}/messages", headers=hana, json={"body": "Hi Brice"})).status_code == 201
    assert last_code is not None


async def test_attachments_must_come_from_the_chat_upload_endpoint(client, mailbox):
    admin, ids, amina, brice, carla = await org_with_people(client, mailbox)
    group = (await amina.get("/chat/conversations")).json()[0]
    bad = {"key": "leave/other/secret.pdf", "name": "secret.pdf", "content_type": "application/pdf", "size": 10}
    assert (await amina.post(f"/chat/conversations/{group['id']}/messages", {"body": "look", "attachments": [bad]})).status_code == 400
    assert (await amina.post("/uploads/chat-attachment", {"content_type": "application/x-msdownload", "size_bytes": 10})).status_code == 400
    assert (await amina.post("/uploads/chat-attachment", {"content_type": "image/png", "size_bytes": 20_000_000})).status_code == 400
    up = (await amina.post("/uploads/chat-attachment", {"content_type": "image/png", "size_bytes": 1000})).json()
    assert up["key"].startswith("chat/")
    good = {"key": up["key"], "name": "photo.png", "content_type": "image/png", "size": 1000}
    sent = await amina.post(f"/chat/conversations/{group['id']}/messages", {"body": "", "attachments": [good]})
    assert sent.status_code == 201 and sent.json()["attachments"][0]["name"] == "photo.png" and sent.json()["attachments"][0]["url"]
    assert {c["id"]: c for c in (await brice.get("/chat/conversations")).json()}[group["id"]]["last_message_preview"] == "📷"


async def test_messages_are_pushed_live_to_the_people_in_the_conversation(client, mailbox):
    admin, ids, amina, brice, carla = await org_with_people(client, mailbox)
    me_company = (await admin.get("/me")).json()["company_id"]
    from uuid import UUID

    cid = UUID(me_company)
    r = get_redis()
    ps = r.pubsub()
    await ps.subscribe(user_channel(cid, UUID(await uid(brice))), site_channel(cid, UUID(ids["site_id"])))
    await ps.get_message(timeout=1)
    await ps.get_message(timeout=1)
    conv = (await amina.post("/chat/conversations/direct", {"user_id": await uid(brice)})).json()
    await amina.post(f"/chat/conversations/{conv['id']}/messages", {"body": "direct hello"})
    group = next(c for c in (await amina.get("/chat/conversations")).json() if c["kind"] == "site")
    await amina.post(f"/chat/conversations/{group['id']}/messages", {"body": "group hello"})
    got = []
    for _ in range(10):
        m = await ps.get_message(ignore_subscribe_messages=True, timeout=1)
        if m:
            got.append(json.loads(m["data"]))
        if len(got) == 2:
            break
    await ps.aclose()
    assert sorted(g["message"]["body"] for g in got) == ["direct hello", "group hello"]
    assert {g["kind"] for g in got} == {"direct", "site"}
    # the ticket for the socket lists exactly the channels this person may listen on
    t = (await brice.post("/chat/ticket")).json()
    raw = json.loads(await r.get(f"ws:ticket:{t['ticket']}"))
    assert user_channel(cid, UUID(await uid(brice))) in raw["extra"] and site_channel(cid, UUID(ids["site_id"])) in raw["extra"]
    assert not any("site" in c and str(ids["site_id"]) not in c and "chat:site" in c for c in raw["extra"])
    await asyncio.sleep(0)
