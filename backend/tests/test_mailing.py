"""The branded e-mail layout and who gets which content."""

import re

from staffsync.core import adapters
from staffsync.core.config import get_settings
from staffsync.core.mailing import ACCENT, LOGO_PATH, EmailContent, build_message, from_plain_text, render_html, render_text
from tests.helpers import last_code, seed_org, signup_owner

CONTENT = EmailContent(
    heading="Welcome to StaffSync",
    paragraphs=["Demo Logistics created your account.", "Open https://app.example.com/x?a=1&b=2 to start."],
    details=[("Sign in with", "eva@example.com")],
    highlight=("Temporary password", "rrGbts6WyKKd"),
    button=("Open the invitation", "https://app.example.com/invite/tok"),
    note="Keep this private.",
)


def test_the_logo_is_a_small_embedded_file():
    assert LOGO_PATH.exists() and LOGO_PATH.stat().st_size < 40_000  # it travels inside every e-mail


def test_html_uses_the_app_colours_and_shows_every_part():
    html = render_html(CONTENT, lang="en", to="eva@example.com")
    assert ACCENT in html and "cid:staffsync-logo" in html and "StaffSync" in html
    for shown in ("Welcome to StaffSync", "rrGbts6WyKKd", "Temporary password", "eva@example.com", "Open the invitation", "Keep this private."):
        assert shown in html
    assert 'href="https://app.example.com/invite/tok"' in html  # the button, and the same address in small print
    assert 'href="https://app.example.com/x?a=1&amp;b=2"' in html  # links inside text become links, ampersand escaped
    assert "Sent to eva@example.com" in html and "<style" not in html  # inline styles only: mail programs drop style sheets


def test_text_from_the_user_is_escaped_never_run_as_html():
    evil = EmailContent(heading="<script>alert(1)</script>", paragraphs=['<img src=x onerror="steal()">'], details=[("Name", "<b>Eva</b>")], highlight=("Code", "<i>1</i>"))
    html = render_html(evil)
    assert "<script>" not in html and "<img src=x" not in html and "<b>Eva</b>" not in html and "<i>1</i>" not in html
    assert "&lt;script&gt;" in html


def test_french_labels_in_the_frame():
    html = render_html(CONTENT, lang="fr", to="eva@example.com")
    assert "Envoyé à eva@example.com" in html and "La présence sur vos chantiers" in html


def test_plain_text_version_carries_the_same_information():
    text = render_text(CONTENT)
    for shown in ("rrGbts6WyKKd", "Sign in with: eva@example.com", "https://app.example.com/invite/tok", "Keep this private."):
        assert shown in text
    assert "<" not in text


def test_a_message_nobody_designed_still_gets_the_layout():
    c = from_plain_text("Trial ending soon", "Your StaffSync trial ends in 3 days.\n\nUpgrade to keep your data.")
    assert c.heading == "Trial ending soon" and len(c.paragraphs) == 2


def test_the_message_has_text_html_and_the_logo_inside():
    msg = build_message(sender=("StaffSync", "no-reply@staffsync.app"), to="eva@example.com", subject="Your account", content=CONTENT)
    assert msg["To"] == "eva@example.com" and msg["Subject"] == "Your account" and "no-reply@staffsync.app" in msg["From"]
    assert msg.get_content_type() == "multipart/alternative"
    kinds = [p.get_content_type() for p in msg.walk()]
    assert "text/plain" in kinds and "text/html" in kinds and "image/png" in kinds
    logo = next(p for p in msg.walk() if p.get_content_type() == "image/png")
    assert logo["Content-ID"] == "<staffsync-logo>" and logo.get_payload(decode=True).startswith(b"\x89PNG")
    html = next(p for p in msg.walk() if p.get_content_type() == "text/html").get_content()
    assert "cid:staffsync-logo" in html


async def test_smtp_sends_the_built_message_with_the_configured_server(monkeypatch):
    import aiosmtplib

    sent = {}

    async def fake_send(message, **kw):
        sent.update(kw, message=message)

    monkeypatch.setattr(aiosmtplib, "send", fake_send)
    s = get_settings()
    for k, v in {"smtp_host": "sandbox.smtp.mailtrap.io", "smtp_port": 2525, "smtp_username": "user", "smtp_password": "pw", "smtp_starttls": True, "smtp_ssl": False}.items():
        monkeypatch.setattr(s, k, v)
    await adapters.SmtpNotifier().send(adapters.Message("email", "eva@example.com", "Hello", "plain body", email=CONTENT, lang="en"))
    assert sent["hostname"] == "sandbox.smtp.mailtrap.io" and sent["port"] == 2525 and sent["start_tls"] is True and sent["use_tls"] is False
    assert sent["username"] == "user" and sent["password"] == "pw"
    assert sent["message"]["To"] == "eva@example.com"
    html = next(p for p in sent["message"].walk() if p.get_content_type() == "text/html").get_content()
    assert "rrGbts6WyKKd" in html


async def test_a_message_without_a_design_is_wrapped_in_the_layout(monkeypatch):
    import aiosmtplib

    sent = {}

    async def fake_send(message, **kw):
        sent["message"] = message

    monkeypatch.setattr(aiosmtplib, "send", fake_send)
    await adapters.SmtpNotifier().send(adapters.Message("email", "x@example.com", "Trial ending soon", "Your StaffSync trial ends in 3 days."))
    html = next(p for p in sent["message"].walk() if p.get_content_type() == "text/html").get_content()
    assert "Trial ending soon" in html and "Your StaffSync trial ends in 3 days." in html and ACCENT in html


# --- the real e-mails -----------------------------------------------------------------------------------------------


def only_email(mailbox):
    mails = [m for m in mailbox if m.channel == "email"]
    assert len(mails) == 1, [(m.channel, m.subject) for m in mailbox]
    return mails[0]


async def test_each_real_email_carries_a_designed_version(client, mailbox):
    # sign-up verification code
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    signup = [m for m in mailbox if m.channel == "email" and m.subject and "Verify" in m.subject][0]
    assert signup.email.highlight == ("Verification code", last_code([signup])) and signup.lang == "en"

    # employee with an e-mail address: sign-in details with the temporary password
    mailbox.clear()
    body = {"full_name": "Eva Employee", "employee_no": "E-1", "email": "eva@example.com", "phone": "+237670000201", "branch_id": ids["branch_id"], "site_ids": [ids["site_id"]], "has_smartphone": True, "send_invite": True}
    assert (await admin.post("/employees", body)).status_code == 201
    m = only_email(mailbox)
    temp = re.search(r"temporary password: (\S+?)\.", m.body).group(1)
    assert m.email.heading == "Welcome to StaffSync" and m.email.highlight == ("Temporary password", temp) and m.email.details == [("Sign in with", "eva@example.com")]

    # sign-in code by e-mail
    mailbox.clear()
    await client.post("/auth/otp/request", json={"identifier": "eva@example.com", "password": temp})
    code = only_email(mailbox)
    assert code.email.highlight[0] == "Sign-in code" and re.fullmatch(r"\d{6}", code.email.highlight[1]) and "5 minutes" in code.email.note

    # password reset
    mailbox.clear()
    await client.post("/auth/password/forgot", json={"email": "eva@example.com"})
    reset = only_email(mailbox)
    assert reset.email.button[0] == "Choose a new password" and reset.email.button[1].startswith(get_settings().dashboard_url + "/reset-password?token=")

    # dashboard invitation
    viewer = next(r for r in (await admin.get("/roles")).json() if r["key"] == "viewer")
    mailbox.clear()
    await admin.post("/users/invite", {"email": "hana@example.com", "full_name": "Hana HR", "role_id": viewer["id"], "scope_type": "company", "scope_ids": []})
    invite = only_email(mailbox)
    assert invite.email.button[0] == "Open the invitation" and "/invite/" in invite.email.button[1] and invite.email.highlight[0] == "Temporary password"

    # company export
    mailbox.clear()
    assert (await admin.post("/company/export", {})).status_code == 200
    export = only_email(mailbox)
    assert export.email.heading == "Your data export is ready" and export.email.button[0] == "Download the export"


async def test_an_employee_without_an_email_is_texted_not_mailed(client, mailbox):
    admin = await signup_owner(client, mailbox)
    ids = await seed_org(admin)
    mailbox.clear()
    await admin.post("/employees", {"full_name": "Sam Phone", "employee_no": "E-2", "phone": "+237670000202", "branch_id": ids["branch_id"], "site_ids": [ids["site_id"]], "has_smartphone": True, "send_invite": True})
    assert [m.channel for m in mailbox] == ["sms"] and mailbox[0].email is None  # SMS stays plain text
