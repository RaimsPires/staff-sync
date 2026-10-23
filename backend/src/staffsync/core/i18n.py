"""Locale resolution and gettext translation.

Locale chain: Accept-Language header, then the signed-in user's setting, then their company's, then `en`.
Source strings are English; `locales/<lang>/LC_MESSAGES/messages.po` holds the translations (stdlib `gettext`
semantics, plurals included). `.po` files are compiled in memory on first use, so there is no build step.
Run `make i18n` after adding or changing a message.
"""

import gettext
import io
from contextvars import ContextVar
from functools import lru_cache
from pathlib import Path
from typing import Any

from babel.messages.mofile import write_mo
from babel.messages.pofile import read_po

from staffsync.core.messages import CODE_MESSAGES, FLAG_REASONS, STATUS_MESSAGES, TITLES, VALIDATION_MESSAGES

SUPPORTED = ("en", "fr")
DEFAULT = "en"
LOCALES_DIR = Path(__file__).parent / "locales"

_locale: ContextVar[str] = ContextVar("locale", default=DEFAULT)
_explicit: ContextVar[bool] = ContextVar("locale_explicit", default=False)


def normalize(tag: str | None) -> str | None:
    """'fr-CA' -> 'fr'; unsupported or empty -> None."""
    base = (tag or "").strip().lower().replace("_", "-").split("-")[0]
    return base if base in SUPPORTED else None


def parse_accept_language(header: str | None) -> str | None:
    """Best supported language by q-value, or None."""
    if not header:
        return None
    ranked: list[tuple[float, int, str]] = []
    for i, part in enumerate(header.split(",")):
        tag, _, params = part.strip().partition(";")
        q = 1.0
        if params.strip().startswith("q="):
            try:
                q = float(params.strip()[2:])
            except ValueError:
                continue
        lang = normalize(tag)
        if lang and q > 0:
            ranked.append((-q, i, lang))
    return min(ranked)[2] if ranked else None


def set_request_locale(header: str | None) -> None:
    lang = parse_accept_language(header)
    _explicit.set(lang is not None)
    _locale.set(lang or DEFAULT)


def apply_user_locale(user_locale: str | None, company_locale: str | None = None) -> None:
    """Only fills in when the request did not name a language itself."""
    if _explicit.get():
        return
    _locale.set(normalize(user_locale) or normalize(company_locale) or DEFAULT)


def current_locale() -> str:
    return _locale.get()


def recipient_locale(user_locale: str | None = None, company_locale: str | None = None) -> str:
    """Language for a message sent to someone else (email/SMS): the request's own language, if it named one,
    otherwise the recipient's setting, otherwise the company's."""
    if _explicit.get():
        return _locale.get()
    return normalize(user_locale) or normalize(company_locale) or _locale.get()


@lru_cache
def translations(lang: str) -> gettext.NullTranslations:
    po = LOCALES_DIR / lang / "LC_MESSAGES" / "messages.po"
    if lang == DEFAULT or not po.exists():
        return gettext.NullTranslations()
    buf = io.BytesIO()
    with po.open("rb") as f:
        write_mo(buf, read_po(f, locale=lang))
    buf.seek(0)
    return gettext.GNUTranslations(buf)


def _interpolate(text: str, params: dict[str, Any]) -> str:
    if not params or "%(" not in text:
        return text
    try:
        return text % params
    except (KeyError, TypeError, ValueError):
        return text


def gettext_(msgid: str, lang: str | None = None, **params: Any) -> str:
    return _interpolate(translations(lang or current_locale()).gettext(msgid), params)


def _translated(msgid: str, lang: str) -> str | None:
    """The translation, or None when this language has none (so callers can fall back to something friendlier)."""
    out = translations(lang).gettext(msgid)
    return out if out != msgid or lang == DEFAULT else None


def code_message(code: str, lang: str | None = None, **params: Any) -> str | None:
    lang = lang or current_locale()
    entry = CODE_MESSAGES.get(code)
    if entry is None:
        return None
    if isinstance(entry, tuple):
        singular, plural, name = entry
        n = int(params.get(name, 1))
        return _interpolate(translations(lang).ngettext(singular, plural, n), params)
    return gettext_(entry, lang, **params)


def flag_reasons(reasons: list[str], lang: str | None = None) -> str:
    return ", ".join(gettext_(FLAG_REASONS[r], lang) if r in FLAG_REASONS else r.replace("_", " ").lower() for r in reasons)


def status_message(status: int, lang: str | None = None) -> str:
    return gettext_(STATUS_MESSAGES.get(status) or STATUS_MESSAGES[500], lang)


def title_for(status: int, lang: str | None = None) -> str | None:
    return gettext_(TITLES[status], lang) if status in TITLES else None


def validation_message(error_type: str, lang: str | None = None, **params: Any) -> str:
    msgid = VALIDATION_MESSAGES.get(error_type) or VALIDATION_MESSAGES["default"]
    return gettext_(msgid, lang, **params)


def error_message(code: str, status: int, detail: str | None, params: dict[str, Any], lang: str | None = None) -> str:
    """User-facing text for an error: never a bare status code, never another language's raw text."""
    lang = lang or current_locale()
    if lang == DEFAULT and detail:
        return detail
    if detail:
        hit = _translated(detail, lang)
        if hit:
            return _interpolate(hit, params)
    return code_message(code, lang, **params) or status_message(status, lang)
