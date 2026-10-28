"""Branded e-mails: one layout (logo, theme colours, a highlighted code or password, a button, a footer) for every message.

E-mail programs ignore Tailwind classes and external style sheets, so the styles are written inline on a table layout, with the
same colour values as the dashboard theme (`admin/src/app/globals.css`). Each message has an HTML and a plain-text version, and
the logo travels inside the message (so it shows without "load images" and without a public address).
"""

import html
import re
from dataclasses import dataclass, field
from email.message import EmailMessage
from email.utils import formataddr, make_msgid
from pathlib import Path

from staffsync.core.i18n import gettext_

# Dashboard theme (light), see admin/src/app/globals.css.
BG, SURFACE, SURFACE_2 = "#f4f6f9", "#ffffff", "#f8f9fb"
BORDER = "#e3e7ed"
TEXT, TEXT_2, TEXT_3 = "#0d1b2e", "#4a5668", "#6f7a8b"
ACCENT, ACCENT_SOFT, ACCENT_EDGE = "#0b67dd", "#e8f0fc", "#cfe0fa"
OK = "#16a34a"
FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
MONO = "'SFMono-Regular',Menlo,Consolas,'Liberation Mono',monospace"

LOGO_PATH = Path(__file__).resolve().parent.parent / "assets" / "email-logo.png"


@dataclass
class EmailContent:
    """What an e-mail says. Everything is already translated by the caller."""

    heading: str
    paragraphs: list[str] = field(default_factory=list)
    #: A short value to copy, shown large in a tinted box: (label, value), e.g. a sign-in code or a temporary password.
    highlight: tuple[str, str] | None = None
    #: Label and value rows, e.g. [("Sign in with", "name@company.com")].
    details: list[tuple[str, str]] = field(default_factory=list)
    #: (label, address): a button, with the address repeated in small print for programs that block buttons.
    button: tuple[str, str] | None = None
    #: Small print under the card content.
    note: str | None = None


def _esc(text: str) -> str:
    return html.escape(text, quote=True)


_URL = re.compile(r"(https?://[^\s<]+)")


def _linkify(text: str) -> str:
    return _URL.sub(lambda m: f'<a href="{m.group(1)}" style="color:{ACCENT};text-decoration:underline;">{m.group(1)}</a>', _esc(text)).replace("\n", "<br>")


def from_plain_text(subject: str | None, body: str) -> EmailContent:
    """A message nobody wrote a layout for (for example a billing notice): the subject as heading, the text as paragraphs."""
    return EmailContent(heading=subject or "StaffSync", paragraphs=[p.strip() for p in re.split(r"\n\s*\n", body.strip()) if p.strip()] or [body])


def render_html(content: EmailContent, *, lang: str = "en", to: str | None = None, logo_src: str = "cid:staffsync-logo") -> str:
    """The HTML version. `logo_src` is `cid:...` when sent, or a data address when previewed in a browser."""
    p = lambda text: f'<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:{TEXT_2};">{_linkify(text)}</p>'  # noqa: E731
    parts: list[str] = [f'<h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-0.01em;color:{TEXT};">{_esc(content.heading)}</h1>']
    parts += [p(text) for text in content.paragraphs]

    if content.details:
        rows = "".join(
            f'<tr><td style="padding:9px 14px;font-size:13px;color:{TEXT_3};border-top:1px solid {BORDER};white-space:nowrap;">{_esc(k)}</td>'
            f'<td style="padding:9px 14px;font-size:14px;font-weight:600;color:{TEXT};border-top:1px solid {BORDER};word-break:break-all;">{_esc(v)}</td></tr>'
            for k, v in content.details
        )
        parts.append(
            f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;margin:4px 0 18px;border:1px solid {BORDER};border-radius:12px;border-collapse:separate;background:{SURFACE_2};">{rows}</table>'
        )

    if content.highlight:
        label, value = content.highlight
        parts.append(
            f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;margin:4px 0 20px;"><tr><td align="center" style="text-align:center;background:{ACCENT_SOFT};border:1px solid {ACCENT_EDGE};border-radius:14px;padding:18px 16px;">'
            f'<div style="font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:{TEXT_3};margin-bottom:8px;">{_esc(label)}</div>'
            f'<div style="font-family:{MONO};font-size:{30 if len(value) <= 8 else 22}px;font-weight:700;letter-spacing:{".18em" if len(value) <= 8 else ".06em"};color:{ACCENT};word-break:break-all;">{_esc(value)}</div>'
            "</td></tr></table>"
        )

    if content.button:
        label, url = content.button
        parts.append(
            '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 10px;"><tr>'
            f'<td align="center" bgcolor="{ACCENT}" style="background:{ACCENT};border-radius:10px;">'
            f'<a href="{_esc(url)}" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">{_esc(label)}</a>'
            "</td></tr></table>"
            f'<p style="margin:0 0 18px;font-size:12px;line-height:1.5;color:{TEXT_3};">{_esc(gettext_("If the button does not work, copy this address into your browser:", lang))}<br>'
            f'<a href="{_esc(url)}" style="color:{ACCENT};word-break:break-all;">{_esc(url)}</a></p>'
        )

    if content.note:
        parts.append(f'<p style="margin:6px 0 0;font-size:13px;line-height:1.6;color:{TEXT_3};">{_linkify(content.note)}</p>')

    tagline = gettext_("Attendance for job sites", lang)
    ignore = gettext_("If you did not expect this e-mail, you can safely ignore it.", lang)
    sent_to = f" {_esc(gettext_('Sent to', lang))} {_esc(to)}." if to else ""
    preheader = _esc(content.paragraphs[0] if content.paragraphs else content.heading)[:140]
    return f"""<!doctype html>
<html lang="{_esc(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>{_esc(content.heading)}</title>
</head>
<body style="margin:0;padding:0;background:{BG};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:{BG};">{preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:{BG};">
<tr><td align="center" style="padding:32px 14px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;font-family:{FONT};">
    <tr><td style="padding:0 6px 18px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:11px;"><img src="{logo_src}" width="44" height="44" alt="StaffSync" style="display:block;border:0;border-radius:11px;width:44px;height:44px;"></td>
        <td style="font-size:21px;font-weight:700;letter-spacing:-0.01em;color:{TEXT};font-family:{FONT};">StaffSync</td>
      </tr></table>
    </td></tr>
    <tr><td style="background:{SURFACE};border:1px solid {BORDER};border-radius:18px;overflow:hidden;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;">
        <tr><td height="5" style="height:5px;line-height:5px;font-size:0;background:{ACCENT};background-image:linear-gradient(90deg,{OK},{ACCENT});">&nbsp;</td></tr>
        <tr><td style="padding:30px 30px 26px;font-family:{FONT};">
{"".join(parts)}
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:18px 8px 0;text-align:center;font-size:12px;line-height:1.7;color:{TEXT_3};font-family:{FONT};">
      {_esc(ignore)}{sent_to}<br>
      <strong style="color:{TEXT_2};">StaffSync</strong> &middot; {_esc(tagline)}
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>"""


def render_text(content: EmailContent, *, lang: str = "en") -> str:
    """The plain-text version (shown by programs that block HTML, and by screen readers' fallback)."""
    lines: list[str] = [content.heading, "=" * min(len(content.heading), 60), ""]
    for para in content.paragraphs:
        lines += [para, ""]
    for k, v in content.details:
        lines.append(f"{k}: {v}")
    if content.details:
        lines.append("")
    if content.highlight:
        lines += [f"{content.highlight[0]}: {content.highlight[1]}", ""]
    if content.button:
        lines += [f"{content.button[0]}: {content.button[1]}", ""]
    if content.note:
        lines += [content.note, ""]
    lines += ["--", f"StaffSync - {gettext_('Attendance for job sites', lang)}"]
    return "\n".join(lines)


def build_message(*, sender: tuple[str, str], to: str, subject: str, content: EmailContent, lang: str = "en") -> EmailMessage:
    """A ready-to-send message: plain text and HTML alternatives, the logo attached inside the HTML."""
    msg = EmailMessage()
    msg["From"] = formataddr(sender)
    msg["To"] = to
    msg["Subject"] = subject
    msg["Message-ID"] = make_msgid(domain="staffsync.app")
    msg.set_content(render_text(content, lang=lang))
    msg.add_alternative(render_html(content, lang=lang, to=to), subtype="html")
    if LOGO_PATH.exists():
        msg.get_payload()[1].add_related(LOGO_PATH.read_bytes(), "image", "png", cid="<staffsync-logo>", filename="staffsync-logo.png", disposition="inline")
    return msg


def preview_html(content: EmailContent, *, lang: str = "en", to: str | None = None) -> str:
    """The HTML with the logo embedded as a data address, so a browser can open the file on its own."""
    import base64

    logo = "data:image/png;base64," + base64.b64encode(LOGO_PATH.read_bytes()).decode() if LOGO_PATH.exists() else ""
    return render_html(content, lang=lang, to=to, logo_src=logo)
