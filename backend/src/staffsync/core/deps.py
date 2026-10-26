import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, Header, Request
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from starlette.requests import HTTPConnection

from staffsync.common.enums import Perm
from staffsync.core.config import get_settings
from staffsync.core.context import RequestContext, Scope
from staffsync.core.db import SessionLocal, set_tenant
from staffsync.core.errors import Forbidden, Unauthenticated, UpgradeRequired
from staffsync.core.i18n import apply_user_locale
from staffsync.core.redis import get_redis
from staffsync.core.security import decode_access_token, hash_device_id
from staffsync.modules.auth.models import CompanyMember, User
from staffsync.modules.users_roles.scope import resolve_access


def fn_dep(dependency):
    """DB-touching dependencies run in function scope, so the transaction commits before the response is sent."""
    return Depends(dependency, scope="function")


async def get_public_session() -> AsyncIterator[AsyncSession]:
    """For unauthenticated flows (login, signup, OTP): cross-tenant lookups are allowed, the services guard access."""
    async with SessionLocal() as session, session.begin():
        await set_tenant(session, None, bypass=True)
        yield session


PublicSession = Annotated[AsyncSession, fn_dep(get_public_session)]


def _bearer(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise Unauthenticated()
    return authorization[7:].strip()


async def get_identity(authorization: Annotated[str | None, Header()] = None) -> dict:
    """Token only (no DB): verified claims, minus revoked sessions."""
    claims = decode_access_token(_bearer(authorization))
    if await get_redis().exists(f"revoked:sid:{claims['sid']}"):
        raise Unauthenticated("Session revoked")
    return claims


@asynccontextmanager
async def build_ctx(request: Request, claims: dict, x_device_id: str | None, *, need_company: bool) -> AsyncIterator[RequestContext]:
    user_id = uuid.UUID(claims["sub"])
    company_id = uuid.UUID(claims["cid"]) if claims.get("cid") else None
    if need_company and company_id is None:
        raise Forbidden("Select a company first", code="COMPANY_REQUIRED")
    async with SessionLocal() as session, session.begin():
        await set_tenant(session, company_id, bypass=company_id is None)
        user = await session.get(User, user_id)
        if user is None or user.status != "active":
            raise Unauthenticated("Account disabled", code="ACCOUNT_DISABLED")
        apply_user_locale(user.locale)
        perms: frozenset[str] = frozenset()
        scope = Scope(site_ids=frozenset(), branch_ids=frozenset(), self_only=True)
        roles: list[str] = []
        employee_id = None
        if company_id is not None:
            member = (
                await session.exec(
                    select(CompanyMember).where(
                        CompanyMember.company_id == company_id, CompanyMember.user_id == user_id, CompanyMember.status == "active"
                    )
                )
            ).first()
            if member is None:
                raise Unauthenticated("No access to this company", code="ACCOUNT_DISABLED")
            perms, scope, roles, employee_id = await resolve_access(session, company_id, user_id)
        yield RequestContext(
            session=session,
            user=user,
            company_id=company_id,  # type: ignore[arg-type]
            session_id=uuid.UUID(claims["sid"]),
            perms=perms,
            scope=scope,
            employee_id=employee_id,
            device_hash=claims.get("dev") or (hash_device_id(x_device_id) if x_device_id else None),
            request_id=getattr(request.state, "request_id", None),
            ip=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            role_names=roles,
        )


Claims = Annotated[dict, Depends(get_identity)]
DeviceHeader = Annotated[str | None, Header(alias="X-Device-Id")]


async def get_ctx(request: Request, claims: Claims, x_device_id: DeviceHeader = None):
    async with build_ctx(request, claims, x_device_id, need_company=True) as ctx:
        yield ctx


async def get_ctx_no_company(request: Request, claims: Claims, x_device_id: DeviceHeader = None):
    """For endpoints usable before a company is chosen (select-company, /me)."""
    async with build_ctx(request, claims, x_device_id, need_company=False) as ctx:
        yield ctx


Ctx = Annotated[RequestContext, fn_dep(get_ctx)]
CtxNoCompany = Annotated[RequestContext, fn_dep(get_ctx_no_company)]


def require(*perms: Perm, employee: bool = False):
    """Dependency factory: authenticate, check every listed permission (and optionally an employee profile)."""

    async def checker(request: Request, claims: Claims, x_device_id: DeviceHeader = None):
        async with build_ctx(request, claims, x_device_id, need_company=True) as ctx:
            for p in perms:
                ctx.require(p)
            if employee:
                ctx.require_employee()
            yield ctx

    return Depends(checker, scope="function")


def check_app_version(conn: HTTPConnection) -> None:
    """Answer 426 to a mobile build older than APP_VERSION_MIN. Requests without the header (the dashboard, scripts) pass."""
    minimum = get_settings().app_version_min
    got = conn.headers.get("x-app-version")
    if minimum and got:
        parse = lambda v: tuple(int(p) for p in v.split(".")[:3] if p.isdigit())  # noqa: E731
        if parse(got) < parse(minimum):
            raise UpgradeRequired("Please update the app")
