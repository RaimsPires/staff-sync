"""Locale resolution and localized, code-free error messages."""

import re
from pathlib import Path

from babel.messages.pofile import read_po

from staffsync.core import i18n
from staffsync.core.errors import Conflict, NotFound, RateLimited, Unauthenticated
from staffsync.core.messages import CODE_MESSAGES, STATUS_MESSAGES, TITLES, VALIDATION_MESSAGES
from tests.helpers import signup_owner

LOCALES = i18n.LOCALES_DIR


def test_accept_language_parsing():
    assert i18n.parse_accept_language("fr-CA,fr;q=0.9,en;q=0.8") == "fr"
    assert i18n.parse_accept_language("de, en;q=0.5") == "en"
    assert i18n.parse_accept_language("en;q=0.2, fr;q=0.9") == "fr"
    assert i18n.parse_accept_language("de, es") is None
    assert i18n.parse_accept_language("fr;q=abc") is None
    assert i18n.parse_accept_language(None) is None


def test_locale_chain():
    i18n.set_request_locale("fr")
    i18n.apply_user_locale("en")
    assert i18n.current_locale() == "fr"  # header beats the user setting
    i18n.set_request_locale(None)
    i18n.apply_user_locale("fr", "en")
    assert i18n.current_locale() == "fr"
    i18n.set_request_locale(None)
    i18n.apply_user_locale("xx", "fr")
    assert i18n.current_locale() == "fr"
    i18n.set_request_locale(None)
    i18n.apply_user_locale(None, None)
    assert i18n.current_locale() == "en"


def _fr_catalog():
    with (LOCALES / "fr" / "LC_MESSAGES" / "messages.po").open("rb") as f:
        return read_po(f, locale="fr")


def test_french_catalog_is_complete():
    untranslated = [m.id for m in _fr_catalog() if m.id and (not all(m.string) if isinstance(m.string, tuple) else not m.string)]
    fuzzy = [m.id for m in _fr_catalog() if m.id and m.fuzzy]
    assert not untranslated and not fuzzy, (untranslated, fuzzy)


def test_every_registry_message_is_in_the_catalog():
    ids = {m.id if isinstance(m.id, str) else m.id[0] for m in _fr_catalog()}
    entries = [*STATUS_MESSAGES.values(), *TITLES.values(), *VALIDATION_MESSAGES.values()]
    entries += [e if isinstance(e, str) else e[0] for e in CODE_MESSAGES.values()]
    assert not [e for e in entries if e not in ids]


def test_every_fixed_error_sentence_is_translated():
    ids = {m.id for m in _fr_catalog() if isinstance(m.id, str)}
    src = Path(i18n.__file__).parents[1]
    names = r"(?:ValidationFailed|Unauthenticated|Forbidden|NotFound|Conflict|BusinessRule|UpgradeRequired|RateLimited)"
    missing = set()
    for f in src.rglob("*.py"):
        for m in re.finditer(names + r'\(\s*"([^"{]+)"', f.read_text()):
            if m.group(1) not in ids:
                missing.add(m.group(1))
    assert not missing, f"run `make i18n` and translate: {missing}"


def test_plural_forms():
    i18n.set_request_locale("fr")
    one = Conflict("x", code="ROLE_IN_USE", count=1).to_problem()["detail"]
    many = Conflict("x", code="ROLE_IN_USE", count=3).to_problem()["detail"]
    assert one == "1 utilisateur a encore ce rôle." and many == "3 utilisateurs ont encore ce rôle."
    i18n.set_request_locale("en")
    assert i18n.code_message("ROLE_IN_USE", count=2) == "2 users still have this role."


def test_error_rendering_never_shows_status_codes():
    for lang in ("en", "fr"):
        i18n.set_request_locale(lang)
        for err in (NotFound(), Unauthenticated(), RateLimited(), Conflict(code="SOMETHING_NEW")):
            detail = err.to_problem()["detail"]
            assert detail and not re.search(r"\b[1-5]\d\d\b", detail), (lang, detail)
    i18n.set_request_locale("fr")
    assert NotFound("Site not found").to_problem()["detail"] == "Site introuvable."
    assert Conflict("brand new english", code="NOPE").to_problem()["detail"].startswith("Cela")


async def test_unknown_route_and_method_localized(client):
    r = await client.get("/nope", headers={"Accept-Language": "fr"})
    assert r.status_code == 404 and r.json()["code"] == "NOT_FOUND"
    assert r.json()["detail"] == "Nous n'avons pas trouvé ce que vous cherchez."
    r = await client.get("/nope")
    assert r.json()["detail"] == "We couldn't find what you were looking for."
    r = await client.delete("/auth/login", headers={"Accept-Language": "fr"})
    assert r.status_code == 405 and r.json()["code"] == "METHOD_NOT_ALLOWED"


async def test_validation_errors_are_localized_per_field(client):
    r = await client.post("/auth/login", json={}, headers={"Accept-Language": "fr"})
    assert r.status_code == 400 and r.json()["code"] == "VALIDATION"
    assert {e["msg"] for e in r.json()["errors"]} == {"Ce champ est requis."}
    r = await client.post("/auth/login", json={}, headers={"Accept-Language": "en"})
    assert {e["msg"] for e in r.json()["errors"]} == {"This field is required."}


async def test_user_setting_used_without_header_and_header_wins(client, mailbox):
    admin = await signup_owner(client, mailbox)
    assert (await admin.patch("/me", {"locale": "fr"})).status_code == 200
    missing = "/sites/00000000-0000-0000-0000-000000000000"
    r = await admin.get(missing)
    assert r.status_code == 404 and r.json()["detail"] == "Nous n'avons pas trouvé ce que vous cherchez."
    r = await admin.get(missing, headers={"Accept-Language": "en"})
    assert r.json()["detail"] == "We couldn't find what you were looking for."


def test_flag_reasons_and_notification_text():
    assert i18n.flag_reasons(["MOCK_LOCATION", "WHATEVER_NEW"], "fr") == "Fausse position détectée, whatever new"
    assert i18n.gettext_("Leave approved", "fr") == "Congé approuvé"
    assert i18n.gettext_("Leave approved", "en") == "Leave approved"
    assert i18n.gettext_("free text written by a manager", "fr") == "free text written by a manager"


def test_recipient_locale():
    i18n.set_request_locale(None)
    assert i18n.recipient_locale("fr") == "fr"
    assert i18n.recipient_locale(None, "fr") == "fr"
    assert i18n.recipient_locale("zz", None) == "en"
    i18n.set_request_locale("en")
    assert i18n.recipient_locale("fr") == "en"  # an explicit request language wins


async def test_emails_use_the_recipients_language(client, mailbox):
    body = {"full_name": "Olive Owner", "email": "o@example.com", "password": "correct-horse-battery", "company_name": "Acme", "accept_terms": True, "locale": "fr"}
    assert (await client.post("/auth/signup", json=body)).status_code == 201
    assert mailbox[-1].subject == "Vérifiez votre adresse e-mail"
    assert "Votre code de vérification StaffSync" in mailbox[-1].body
    body.update(email="p@example.com", locale="en")
    assert (await client.post("/auth/signup", json=body)).status_code == 201
    assert mailbox[-1].subject == "Verify your email"
