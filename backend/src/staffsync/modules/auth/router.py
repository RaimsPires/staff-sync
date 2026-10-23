from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Cookie, Header, Request, Response
from sqlmodel import select

from staffsync.core.deps import Ctx, CtxNoCompany, PublicSession
from staffsync.core.errors import Forbidden, NotFound, Unauthenticated
from staffsync.core.limits import limiter
from staffsync.core.security import jwks, sha256
from staffsync.modules.auth import service
from staffsync.modules.auth.models import RefreshToken
from staffsync.modules.auth.schemas import (
    AcceptInviteIn,
    ForgotIn,
    LoginIn,
    LoginOut,
    MeOut,
    MeUpdateIn,
    MfaDisableIn,
    MfaEnableIn,
    MfaEnableOut,
    MfaSetupOut,
    MfaVerifyIn,
    OtpRequestIn,
    OtpRequestOut,
    OtpVerifyIn,
    OtpVerifyOut,
    PasswordChangeIn,
    RefreshIn,
    ResetIn,
    SelectCompanyIn,
    SessionOut,
    SignupIn,
    SignupOut,
    VerifyEmailIn,
)
from staffsync.modules.auth.tokens import TokenPair, revoke_family, rotate_refresh

router = APIRouter(tags=["auth"])

REFRESH_COOKIE = "ss_refresh"
CSRF_COOKIE = "ss_csrf"
TRUST_COOKIE = "ss_trusted"


def _meta(request: Request) -> tuple[str | None, str | None]:
    return (request.client.host if request.client else None), request.headers.get("user-agent")


def _set_web_cookies(response: Response, tokens: TokenPair, *, remember: bool = False) -> None:
    from staffsync.core.config import get_settings

    secure = get_settings().app_env != "dev"
    max_age = 7 * 86400
    response.set_cookie(REFRESH_COOKIE, tokens.refresh_token, httponly=True, secure=secure, samesite="strict", max_age=max_age, path=f"{get_settings().api_prefix}/auth")
    response.set_cookie(CSRF_COOKIE, sha256(tokens.refresh_token)[:32], httponly=False, secure=secure, samesite="strict", max_age=max_age)


@router.post("/auth/signup", response_model=SignupOut, status_code=201)
@limiter.limit("10/hour")
async def signup(request: Request, body: SignupIn, session: PublicSession):
    await service.signup(session, body)
    return SignupOut(email=body.email.lower())


@router.post("/auth/verify-email", response_model=TokenPair)
@limiter.limit("20/hour")
async def verify_email(request: Request, body: VerifyEmailIn, response: Response, session: PublicSession):
    ip, ua = _meta(request)
    tokens = await service.verify_email(session, body.email, body.code, ip=ip, ua=ua)
    _set_web_cookies(response, tokens)
    return tokens


@router.post("/auth/login", response_model=LoginOut)
@limiter.limit("20/minute")
async def login(request: Request, body: LoginIn, response: Response, session: PublicSession, ss_trusted: Annotated[str | None, Cookie()] = None):
    ip, ua = _meta(request)
    out = await service.login(session, body.email, body.password, trusted_cookie=ss_trusted, remember=body.remember_me, ip=ip, ua=ua)
    if out.tokens:
        _set_web_cookies(response, out.tokens, remember=body.remember_me)
    return out


@router.post("/auth/mfa/verify", response_model=LoginOut)
@limiter.limit("10/minute")
async def mfa_verify(request: Request, body: MfaVerifyIn, response: Response, session: PublicSession):
    ip, ua = _meta(request)
    out, trust = await service.mfa_verify(session, body.mfa_ticket, body.code, body.trust_device, ip=ip, ua=ua)
    if out.tokens:
        _set_web_cookies(response, out.tokens)
    if trust:
        from staffsync.core.config import get_settings

        response.set_cookie(TRUST_COOKIE, trust, httponly=True, secure=get_settings().app_env != "dev", samesite="strict", max_age=30 * 86400)
    return out


@router.post("/auth/otp/request", response_model=OtpRequestOut)
@limiter.limit("10/minute")
async def otp_request(request: Request, body: OtpRequestIn, session: PublicSession):
    return OtpRequestOut(resend_after_s=await service.otp_request(session, body.identifier))


@router.post("/auth/otp/verify", response_model=OtpVerifyOut)
@limiter.limit("20/minute")
async def otp_verify(request: Request, body: OtpVerifyIn, session: PublicSession):
    ip, ua = _meta(request)
    return await service.otp_verify(session, body.identifier, body.code, body.device_id, ip=ip, ua=ua)


@router.post("/auth/select-company")
async def select_company(request: Request, body: SelectCompanyIn, ctx: CtxNoCompany):
    ip, ua = _meta(request)
    pair, profile = await service.select_company(ctx.session, ctx, body.company_id, ip=ip, ua=ua)
    return {"tokens": pair, "user": profile}


@router.get("/auth/sso/{provider}/authorize")
async def sso_authorize(provider: str):
    raise Forbidden(f"SSO provider '{provider}' is not configured", code="SSO_NOT_CONFIGURED", provider=provider)


@router.get("/auth/sso/{provider}/callback")
async def sso_callback(provider: str):
    raise Forbidden(f"SSO provider '{provider}' is not configured", code="SSO_NOT_CONFIGURED", provider=provider)


@router.post("/auth/refresh", response_model=TokenPair)
@limiter.limit("60/minute")
async def refresh(
    request: Request,
    response: Response,
    session: PublicSession,
    body: RefreshIn | None = None,
    ss_refresh: Annotated[str | None, Cookie()] = None,
    ss_csrf: Annotated[str | None, Cookie()] = None,
    x_csrf_token: Annotated[str | None, Header()] = None,
):
    raw = (body.refresh_token if body else None) or ss_refresh
    if not raw:
        raise Unauthenticated("Missing refresh token", code="INVALID_REFRESH")
    if (body is None or not body.refresh_token) and (not ss_csrf or x_csrf_token != ss_csrf):
        raise Forbidden("CSRF token mismatch", code="CSRF")  # cookie-based call
    ip, ua = _meta(request)
    pair, row = await rotate_refresh(session, raw, ip=ip, user_agent=ua)
    if row.channel == "web":
        _set_web_cookies(response, pair)
    return pair


@router.post("/auth/logout", status_code=204)
async def logout(ctx: CtxNoCompany, response: Response):
    await revoke_family(ctx.session, ctx.session_id)
    response.delete_cookie(REFRESH_COOKIE, path="/api/v1/auth")
    response.delete_cookie(CSRF_COOKIE)


@router.post("/auth/password/forgot", status_code=202)
@limiter.limit("5/hour")
async def forgot(request: Request, body: ForgotIn, session: PublicSession):
    await service.forgot_password(session, body.email)
    return {"status": "If the account exists, an email was sent."}


@router.post("/auth/password/reset", status_code=204)
@limiter.limit("10/hour")
async def reset(request: Request, body: ResetIn, session: PublicSession):
    await service.reset_password(session, body.token, body.password)


@router.get("/invitations/{token}")
async def invitation(token: str, session: PublicSession):
    return await service.invitation_preview(session, token)


@router.post("/invitations/{token}/accept", response_model=TokenPair)
@limiter.limit("10/hour")
async def accept_invitation(request: Request, token: str, body: AcceptInviteIn, response: Response, session: PublicSession):
    ip, ua = _meta(request)
    pair = await service.accept_invitation(session, token, body.password, body.full_name, ip=ip, ua=ua)
    _set_web_cookies(response, pair)
    return pair


@router.get("/.well-known/jwks.json", include_in_schema=False)
async def jwks_endpoint():
    return jwks()


# --- /me ---------------------------------------------------------------------------------------------


@router.get("/me", response_model=MeOut)
async def me(ctx: CtxNoCompany):
    u = ctx.user
    return MeOut(
        id=u.id,
        full_name=u.full_name,
        email=u.email,
        phone=u.phone,
        locale=u.locale,
        theme=u.theme,
        totp_enabled=u.totp_enabled,
        company_id=ctx.company_id,
        companies=await service.user_companies(ctx.session, u.id),
        roles=ctx.role_names,
        permissions=sorted(ctx.perms),
        scope={
            "all": ctx.scope.site_ids is None,
            "site_ids": None if ctx.scope.site_ids is None else sorted(map(str, ctx.scope.site_ids)),
            "branch_ids": None if ctx.scope.branch_ids is None else sorted(map(str, ctx.scope.branch_ids)),
            "self_only": ctx.scope.self_only,
        },
        employee_id=ctx.employee_id,
    )


@router.patch("/me")
async def update_me(body: MeUpdateIn, ctx: CtxNoCompany):
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(ctx.user, k, v)
    return {"status": "ok"}


@router.get("/me/profile")
async def my_profile(ctx: Ctx):
    return await service.build_profile(ctx.session, ctx.user, ctx.company_id)


@router.post("/me/password", status_code=204)
async def change_password(body: PasswordChangeIn, ctx: CtxNoCompany):
    await service.change_password(ctx.session, ctx, body.current_password, body.new_password)


@router.post("/me/mfa/setup", response_model=MfaSetupOut)
async def mfa_setup(ctx: CtxNoCompany):
    secret, uri = await service.mfa_setup(ctx)
    return MfaSetupOut(secret=secret, otpauth_uri=uri)


@router.post("/me/mfa/enable", response_model=MfaEnableOut)
async def mfa_enable(body: MfaEnableIn, ctx: CtxNoCompany):
    return MfaEnableOut(backup_codes=await service.mfa_enable(ctx, body.code))


@router.delete("/me/mfa", status_code=204)
async def mfa_disable(body: MfaDisableIn, ctx: CtxNoCompany):
    await service.mfa_disable(ctx, body.password)


@router.get("/me/sessions", response_model=list[SessionOut])
async def sessions(ctx: CtxNoCompany):
    rows = await service.list_sessions(ctx.session, ctx)
    return [
        SessionOut(id=r.family_id, channel=r.channel, ip=r.ip, user_agent=r.user_agent, created_at=r.created_at, last_used_at=r.last_used_at, current=r.family_id == ctx.session_id)
        for r in rows
    ]


@router.delete("/me/sessions/{session_id}", status_code=204)
async def delete_session(session_id: UUID, ctx: CtxNoCompany):
    owned = (await ctx.session.exec(select(RefreshToken).where(RefreshToken.family_id == session_id, RefreshToken.user_id == ctx.user.id).limit(1))).first()
    if owned is None:
        raise NotFound()
    await revoke_family(ctx.session, session_id)
