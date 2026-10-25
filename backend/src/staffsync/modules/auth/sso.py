"""Single sign-on for the dashboard with Google and Microsoft (OpenID Connect, authorization code flow).

Only people who already have a StaffSync account can sign in this way; SSO never creates accounts. The identity
provider has already checked the person (including their own two-factor), so our TOTP step is skipped.
"""

import secrets
from dataclasses import dataclass
from urllib.parse import urlencode

import httpx
import jwt

from staffsync.core.config import get_settings
from staffsync.core.errors import Forbidden, Unauthenticated
from staffsync.core.security import read_ticket, sign_ticket

STATE_TTL_S = 600
COOKIE = "ss_sso"


@dataclass(frozen=True)
class Provider:
    name: str
    client_id: str
    client_secret: str
    authorize_url: str
    token_url: str
    userinfo_url: str


def provider(name: str) -> Provider:
    s = get_settings()
    if name == "google" and s.google_client_id and s.google_client_secret:
        return Provider(name, s.google_client_id, s.google_client_secret, "https://accounts.google.com/o/oauth2/v2/auth", "https://oauth2.googleapis.com/token", "https://openidconnect.googleapis.com/v1/userinfo")
    if name == "microsoft" and s.microsoft_client_id and s.microsoft_client_secret:
        base = f"https://login.microsoftonline.com/{s.microsoft_tenant}/oauth2/v2.0"
        return Provider(name, s.microsoft_client_id, s.microsoft_client_secret, f"{base}/authorize", f"{base}/token", "https://graph.microsoft.com/oidc/userinfo")
    raise Forbidden(f"SSO provider '{name}' is not configured", code="SSO_NOT_CONFIGURED", provider=name)


def redirect_uri(name: str) -> str:
    s = get_settings()
    return f"{s.public_api_url.rstrip('/')}{s.api_prefix}/auth/sso/{name}/callback"


def start(name: str) -> tuple[str, str]:
    """-> (address to send the browser to, nonce to remember in a cookie so only this browser can finish the sign-in)."""
    p = provider(name)
    nonce = secrets.token_urlsafe(16)
    state = sign_ticket("sso", f"{name}:{nonce}", STATE_TTL_S)
    query = {"client_id": p.client_id, "redirect_uri": redirect_uri(name), "response_type": "code", "scope": "openid email profile", "state": state, "prompt": "select_account"}
    return f"{p.authorize_url}?{urlencode(query)}", nonce


async def identify(name: str, code: str, state: str, cookie_nonce: str | None) -> str:
    """Finish the provider round trip and return the person's verified e-mail address."""
    subject = read_ticket("sso", state)  # signed and short-lived
    st_name, _, nonce = subject.partition(":")
    if st_name != name or not cookie_nonce or not secrets.compare_digest(nonce, cookie_nonce):
        raise Unauthenticated("Sign-in was not started in this browser", code="SSO_STATE")
    p = provider(name)
    async with httpx.AsyncClient(timeout=15) as c:
        tok = await c.post(p.token_url, data={"grant_type": "authorization_code", "code": code, "redirect_uri": redirect_uri(name), "client_id": p.client_id, "client_secret": p.client_secret})
        if tok.status_code != 200:
            raise Unauthenticated("The provider refused the sign-in", code="SSO_FAILED")
        body = tok.json()
        info = await c.get(p.userinfo_url, headers={"Authorization": f"Bearer {body['access_token']}"})
        if info.status_code != 200:
            raise Unauthenticated("Could not read your profile", code="SSO_FAILED")
    profile = info.json()
    email = (profile.get("email") or "").strip().lower()
    verified = profile.get("email_verified") in (True, "true")
    if name == "microsoft" and body.get("id_token"):
        # Microsoft does not vouch for the address in userinfo; the id token's "xms_edov" says the domain owner confirmed it.
        claims = jwt.decode(body["id_token"], options={"verify_signature": False})  # received straight from the token endpoint over TLS
        verified = verified or claims.get("xms_edov") in (True, 1, "1", "true")
    if not email or not verified:
        raise Unauthenticated("Your e-mail address is not verified by the provider", code="SSO_UNVERIFIED")
    return email
