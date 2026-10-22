"""Session/token lifecycle: JWT access tokens + rotating opaque refresh tokens with reuse detection."""

from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from pydantic import BaseModel
from sqlalchemy import update
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from staffsync.core.config import get_settings
from staffsync.core.db import session_scope
from staffsync.core.errors import Unauthenticated
from staffsync.core.redis import get_redis
from staffsync.core.security import create_access_token, new_opaque_token, sha256
from staffsync.modules.auth.models import RefreshToken


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


async def issue_tokens(
    session: AsyncSession,
    *,
    user_id: UUID,
    company_id: UUID | None,
    channel: str = "web",
    device_hash: str | None = None,
    ip: str | None = None,
    user_agent: str | None = None,
    family_id: UUID | None = None,
) -> TokenPair:
    s = get_settings()
    days = s.refresh_ttl_days_mobile if channel == "mobile" else s.refresh_ttl_days_web
    family = family_id or uuid4()
    raw = new_opaque_token()
    session.add(
        RefreshToken(
            user_id=user_id,
            company_id=company_id,
            family_id=family,
            token_hash=sha256(raw),
            channel=channel,
            device_hash=device_hash,
            user_agent=user_agent,
            ip=ip,
            created_at=datetime.now(UTC),
            expires_at=datetime.now(UTC) + timedelta(days=days),
        )
    )
    await session.flush()
    access = create_access_token(user_id=user_id, company_id=company_id, session_id=family, device=device_hash)
    return TokenPair(access_token=access, refresh_token=raw, expires_in=s.access_ttl_min * 60)


async def revoke_family(session: AsyncSession, family_id: UUID) -> None:
    now = datetime.now(UTC)
    await session.execute(update(RefreshToken).where(RefreshToken.family_id == family_id, RefreshToken.revoked_at.is_(None)).values(revoked_at=now))  # type: ignore[union-attr]
    await get_redis().set(f"revoked:sid:{family_id}", "1", ex=get_settings().access_ttl_min * 60 + 60)


async def revoke_user_sessions(session: AsyncSession, user_id: UUID, *, company_id: UUID | None = None, except_family: UUID | None = None) -> None:
    q = select(RefreshToken.family_id).where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None)).distinct()  # type: ignore[union-attr]
    if company_id:
        q = q.where(RefreshToken.company_id == company_id)
    for fam in (await session.exec(q)).all():
        if fam != except_family:
            await revoke_family(session, fam)


async def rotate_refresh(session: AsyncSession, raw: str, *, ip: str | None, user_agent: str | None, company_id: UUID | None = None) -> tuple[TokenPair, RefreshToken]:
    row = (await session.exec(select(RefreshToken).where(RefreshToken.token_hash == sha256(raw)))).first()
    now = datetime.now(UTC)
    if row is None:
        raise Unauthenticated("Invalid refresh token", code="INVALID_REFRESH")
    if row.rotated_at is not None or row.revoked_at is not None:
        # An already-used token is being replayed: assume theft and kill the whole family.
        async with session_scope(bypass=True) as other:  # separate transaction: the caller's rolls back on the error
            await revoke_family(other, row.family_id)
        raise Unauthenticated("Refresh token reuse detected", code="REFRESH_REUSE")
    if row.expires_at < now:
        raise Unauthenticated("Refresh token expired", code="INVALID_REFRESH")
    row.rotated_at = now
    row.last_used_at = now
    session.add(row)
    pair = await issue_tokens(
        session,
        user_id=row.user_id,
        company_id=company_id or row.company_id,
        channel=row.channel,
        device_hash=row.device_hash,
        ip=ip or row.ip,
        user_agent=user_agent or row.user_agent,
        family_id=row.family_id,
    )
    return pair, row
