"""Write every e-mail design to `.email-preview/` as an HTML file you can open in a browser (nothing is sent).

    uv run python scripts/preview_emails.py          # English and French
    open .email-preview/index.html
"""

from pathlib import Path

from staffsync.core.i18n import gettext_
from staffsync.core.mailing import EmailContent, preview_html

OUT = Path(__file__).resolve().parent.parent / ".email-preview"
LINK = "https://app.staffsync.example/invite/aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1xY3zA5"


def samples(lang: str) -> dict[str, EmailContent]:
    g = lambda text, **kw: gettext_(text, lang, **kw)  # noqa: E731
    return {
        "employee-welcome": EmailContent(
            heading=g("Welcome to StaffSync"),
            paragraphs=[g("%(company)s created your StaffSync account.", company="Demo Logistics"), g("Download the StaffSync app and sign in with the details below. You will choose your own password the first time you sign in.")],
            details=[(g("Sign in with"), "joseph.ewane@example.com")],
            highlight=(g("Temporary password"), "rrGbts6WyKKd"),
            note=g("Keep this e-mail private: the temporary password only works until you choose your own."),
        ),
        "admin-invitation": EmailContent(
            heading=g("You're invited to StaffSync"),
            paragraphs=[g("%(name)s invited you to StaffSync.", name="Claire Vasseur"), g("Open the invitation to choose your password now. Or sign in with your e-mail address and the temporary password below; you will then be asked to choose your own.")],
            details=[(g("Sign in with"), "hana@example.com")],
            highlight=(g("Temporary password"), "Xk7mQ2pRt9Wc"),
            button=(g("Open the invitation"), LINK),
            note=g("The link and the temporary password stop working in 7 days."),
        ),
        "sign-in-code": EmailContent(
            heading=g("Your login code"),
            paragraphs=[g("Enter this code in the StaffSync app to finish signing in.")],
            highlight=(g("Sign-in code"), "482 913".replace(" ", "")),
            note=g("The code is valid for %(minutes)s minutes. Never share it with anyone.", minutes=5),
        ),
        "verify-email": EmailContent(
            heading=g("Verify your email"),
            paragraphs=[g("Use this code to finish creating your StaffSync account.")],
            highlight=(g("Verification code"), "270574"),
            note=g("The code is valid for 15 minutes."),
        ),
        "reset-password": EmailContent(
            heading=g("Reset your password"),
            paragraphs=[g("We received a request to reset the password of your StaffSync account. Choose a new one with the button below.")],
            button=(g("Choose a new password"), "https://app.staffsync.example/reset-password?token=Qw3rTy5uIo7pAs9dFg1hJk3lZx5cVb7nM9"),
            note=g("The link is valid for one hour. If you did not ask for this, nothing changes and you can ignore this e-mail."),
        ),
        "data-export": EmailContent(
            heading=g("Your data export is ready"),
            paragraphs=[g("The ZIP file with your company's data is ready to download.")],
            button=(g("Download the export"), "https://api.staffsync.example/api/v1/files/exports-token"),
            note=g("The link works for one hour."),
        ),
        "scheduled-report": EmailContent(
            heading=g("Scheduled report: %(name)s", name="Weekly hours"),
            paragraphs=[g("Your scheduled report for %(start)s to %(end)s is ready.", start="2026-10-19", end="2026-10-25")],
            button=(g("Download the report"), "https://api.staffsync.example/api/v1/files/report-token"),
            note=g("The link works for 7 days."),
        ),
    }


def main() -> None:
    OUT.mkdir(exist_ok=True)
    links: list[str] = []
    for lang in ("en", "fr"):
        for name, content in samples(lang).items():
            path = OUT / f"{name}.{lang}.html"
            path.write_text(preview_html(content, lang=lang, to="joseph.ewane@example.com"), encoding="utf-8")
            links.append(f'<li><a href="{path.name}">{name}</a> <small>({lang})</small></li>')
    (OUT / "index.html").write_text("<!doctype html><meta charset=utf-8><title>E-mail previews</title><body style=\"font-family:sans-serif;padding:24px\"><h1>E-mail previews</h1><ul>" + "".join(links) + "</ul>", encoding="utf-8")
    print(f"{len(links)} previews written to {OUT}\nopen {OUT / 'index.html'}")


if __name__ == "__main__":
    main()
