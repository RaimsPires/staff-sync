import hashlib
import hmac
import secrets
import time
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID, uuid4

import jwt
import pyotp
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from pwdlib import PasswordHash

from staffsync.core.config import get_settings
from staffsync.core.errors import Unauthenticated

_hasher = PasswordHash.recommended()  # Argon2id


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, hashed: str | None) -> bool:
    if not hashed:
        _hasher.hash(password)  # constant-ish time for unknown accounts
        return False
    try:
        return _hasher.verify(password, hashed)
    except Exception:
        return False


def sha256(value: str, *, pepper: bool = False) -> str:
    data = value + (get_settings().server_pepper if pepper else "")
    return hashlib.sha256(data.encode()).hexdigest()


def hash_device_id(device_id: str) -> str:
    return sha256(device_id, pepper=True)


def new_opaque_token(nbytes: int = 32) -> str:
    return secrets.token_urlsafe(nbytes)


# No 0/O, 1/l/I: the password is read from a mail or a text message and typed on a phone.
_TEMP_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"


def new_temporary_password(length: int = 12) -> str:
    """A random password to send to someone who must replace it at first sign-in (12 characters: over the 10 minimum)."""
    return "".join(secrets.choice(_TEMP_ALPHABET) for _ in range(length))


def hmac_sign(key: str, message: str) -> str:
    return hmac.new(key.encode(), message.encode(), hashlib.sha256).hexdigest()


def hmac_verify(key: str, message: str, signature: str) -> bool:
    return hmac.compare_digest(hmac_sign(key, message), signature)


# --- JWT (EdDSA) ---------------------------------------------------------------------------------

_private_key: Ed25519PrivateKey | None = None


def _key() -> Ed25519PrivateKey:
    global _private_key
    if _private_key is None:
        s = get_settings()
        if s.jwt_private_key_pem:
            loaded = serialization.load_pem_private_key(s.jwt_private_key_pem.encode(), password=None)
            assert isinstance(loaded, Ed25519PrivateKey)
            _private_key = loaded
        else:
            _private_key = Ed25519PrivateKey.from_private_bytes(hashlib.sha256(s.jwt_secret.encode()).digest())
    return _private_key


def jwks() -> dict[str, Any]:
    from jwt.algorithms import OKPAlgorithm

    jwk = OKPAlgorithm.to_jwk(_key().public_key(), as_dict=True)
    return {"keys": [{**jwk, "kid": get_settings().jwt_key_id, "use": "sig", "alg": "EdDSA"}]}


def create_access_token(*, user_id: UUID, company_id: UUID | None, session_id: UUID, device: str | None = None) -> str:
    s = get_settings()
    now = datetime.now(UTC)
    claims: dict[str, Any] = {
        "sub": str(user_id),
        "cid": str(company_id) if company_id else None,
        "sid": str(session_id),
        "dev": device,
        "iat": now,
        "exp": now + timedelta(minutes=s.access_ttl_min),
        "jti": uuid4().hex,
    }
    return jwt.encode(claims, _key(), algorithm="EdDSA", headers={"kid": s.jwt_key_id})


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, _key().public_key(), algorithms=["EdDSA"], options={"require": ["exp", "sub", "sid"]})
    except jwt.PyJWTError as exc:
        raise Unauthenticated("Invalid or expired token") from exc


# --- TOTP / short-lived signed tickets ----------------------------------------------------------


def new_totp_secret() -> str:
    return pyotp.random_base32()


def verify_totp(secret: str, code: str) -> bool:
    return pyotp.TOTP(secret).verify(code.strip(), valid_window=1)


def totp_uri(secret: str, account: str, issuer: str = "StaffSync") -> str:
    return pyotp.TOTP(secret).provisioning_uri(name=account, issuer_name=issuer)


def sign_ticket(purpose: str, subject: str, ttl_s: int) -> str:
    """Stateless short-lived ticket (MFA, email-verify, password reset) signed with the server secret."""
    s = get_settings()
    exp = int(time.time()) + ttl_s
    payload = f"{purpose}.{subject}.{exp}"
    return f"{payload}.{hmac_sign(s.jwt_secret, payload)}"


def read_ticket(purpose: str, ticket: str) -> str:
    s = get_settings()
    try:
        p, subject, exp, sig = ticket.rsplit(".", 3)
        if p != purpose or int(exp) < time.time() or not hmac_verify(s.jwt_secret, f"{p}.{subject}.{exp}", sig):
            raise ValueError
    except ValueError as exc:
        raise Unauthenticated("Invalid or expired ticket") from exc
    return subject


# --- Field encryption (TOTP secrets, provider keys) ----------------------------------------------

def _fernet():
    import base64

    from cryptography.fernet import Fernet

    s = get_settings()
    key = s.field_encryption_key or base64.urlsafe_b64encode(hashlib.sha256(("fernet:" + s.jwt_secret).encode()).digest()).decode()
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt_field(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def decrypt_field(value: str) -> str:
    return _fernet().decrypt(value.encode()).decode()
