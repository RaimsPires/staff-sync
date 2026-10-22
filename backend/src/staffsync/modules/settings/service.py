import secrets
from uuid import UUID

from sqlmodel import select

from staffsync.core.audit import audit
from staffsync.core.context import RequestContext
from staffsync.core.errors import NotFound, ValidationFailed
from staffsync.core.security import sha256
from staffsync.modules.companies.models import ApiKey, Company
from staffsync.modules.settings.defaults import DEFAULTS, merged


async def company_settings(session, company_id: UUID, section: str) -> dict:
    company = await session.get(Company, company_id)
    return merged(company.settings if company else None, section)


async def update_section(ctx: RequestContext, section: str, patch: dict) -> dict:
    unknown = set(patch) - set(DEFAULTS[section])
    if unknown:
        raise ValidationFailed(f"Unknown setting(s): {', '.join(sorted(unknown))}")
    for k, v in patch.items():  # type-check against the default's type (None defaults accept any)
        d = DEFAULTS[section][k]
        if d is not None and not isinstance(v, type(d)) and not (isinstance(d, (int, float)) and isinstance(v, (int, float)) and not isinstance(v, bool)):
            raise ValidationFailed(f"Setting '{k}' has the wrong type")
    company = await ctx.session.get(Company, ctx.company_id)
    assert company is not None
    before = merged(company.settings, section)
    data = dict(company.settings or {})
    data[section] = {**data.get(section, {}), **patch}
    company.settings = data  # reassign: JSONB mutation is not tracked in place
    ctx.session.add(company)
    audit(ctx, f"settings.{section}_updated", "settings", company.id, before={k: before[k] for k in patch}, after=patch)
    return merged(data, section)


async def create_api_key(ctx: RequestContext, name: str) -> dict:
    raw = "ssk_" + secrets.token_urlsafe(32)
    key = ApiKey(company_id=ctx.company_id, name=name, prefix=raw[:10], key_hash=sha256(raw))
    ctx.session.add(key)
    await ctx.session.flush()
    audit(ctx, "apikey.created", "api_key", key.id, after={"name": name})
    return {"id": key.id, "name": name, "prefix": key.prefix, "key": raw}  # shown once


async def list_api_keys(ctx: RequestContext) -> list[dict]:
    rows = (await ctx.session.exec(select(ApiKey).where(ApiKey.company_id == ctx.company_id, ApiKey.revoked_at.is_(None)))).all()  # type: ignore[union-attr]
    return [{"id": k.id, "name": k.name, "prefix": k.prefix, "last_used_at": k.last_used_at, "created_at": k.created_at} for k in rows]


async def revoke_api_key(ctx: RequestContext, key_id: UUID) -> None:
    from datetime import UTC, datetime

    k = (await ctx.session.exec(select(ApiKey).where(ApiKey.id == key_id, ApiKey.company_id == ctx.company_id))).first()
    if k is None:
        raise NotFound()
    k.revoked_at = datetime.now(UTC)
    audit(ctx, "apikey.revoked", "api_key", k.id)
