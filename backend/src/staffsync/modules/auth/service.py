import hashlib
import re
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID

import phonenumbers
from sqlalchemy import func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from staffsync.core.adapters import notify
from staffsync.core.config import get_settings
from staffsync.core.context import RequestContext
from staffsync.core.errors import AppError, Conflict, Forbidden, NotFound, RateLimited, Unauthenticated, ValidationFailed
from staffsync.core.redis import get_redis
from staffsync.core.security import (
    decrypt_field,
    encrypt_field,
    hash_device_id,
    hash_password,
    new_opaque_token,
    new_totp_secret,
    read_ticket,
    sha256,
    sign_ticket,
    totp_uri,
    verify_password,
    verify_totp,
)
from staffsync.modules.auth.models import CompanyMember, Invitation, RefreshToken, User
from staffsync.modules.auth.schemas import CompanyBrief, LoginOut, OtpVerifyOut, SignupIn, UserProfileOut
from staffsync.modules.auth.tokens import TokenPair, issue_tokens, revoke_family, revoke_user_sessions
from staffsync.modules.branches.models import Branch
from staffsync.modules.companies.models import Company
from staffsync.modules.employees.models import Employee, EmployeeSite
from staffsync.modules.sites.models import Site, SiteManager
from staffsync.modules.users_roles.models import Role, UserRole
from staffsync.modules.users_roles.seed import assign_role, seed_company_roles

COLORS = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#059669", "#0891b2"]
MAX_FAILED = 5
LOCK_MIN = 15


class AccountError(AppError):
    status = 403
    code = "ACCOUNT_DISABLED"
    title = "Account unavailable"


# --- helpers -----------------------------------------------------------------------------------------


def normalize_identifier(raw: str, default_region: str = "CM") -> tuple[str, str]:
    """Returns (kind, value): email lowercased, or phone in E.164."""
    raw = raw.strip()
    if "@" in raw:
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", raw):
            raise ValidationFailed("Invalid email address")
        return "email", raw.lower()
    try:
        num = phonenumbers.parse(raw, None if raw.startswith("+") else default_region)
        if not phonenumbers.is_valid_number(num):
            raise ValueError
    except Exception as exc:
        raise ValidationFailed("Invalid phone number") from exc
    return "phone", phonenumbers.format_number(num, phonenumbers.PhoneNumberFormat.E164)


def initials(name: str) -> str:
    parts = [p for p in re.split(r"\s+", name.strip()) if p]
    return ("".join(p[0] for p in parts[:2]) or "?").upper()


def color_for(company_id: UUID) -> str:
    return COLORS[company_id.int % len(COLORS)]


async def find_user(session: AsyncSession, kind: str, value: str) -> User | None:
    col = User.email if kind == "email" else User.phone
    return (await session.exec(select(User).where(col == value))).first()


async def user_companies(session: AsyncSession, user_id: UUID, *, mobile_only: bool = False) -> list[CompanyBrief]:
    members = (
        await session.exec(select(CompanyMember, Company).join(Company, Company.id == CompanyMember.company_id).where(CompanyMember.user_id == user_id, CompanyMember.status == "active"))
    ).all()
    out: list[CompanyBrief] = []
    for member, company in members:
        emp = (await session.exec(select(Employee).where(Employee.company_id == company.id, Employee.user_id == user_id, Employee.status != "deactivated"))).first()
        roles = (await session.exec(select(Role.key).join(UserRole, UserRole.role_id == Role.id).where(UserRole.user_id == user_id, UserRole.company_id == company.id))).all()
        manages = (await session.exec(select(func.count()).select_from(SiteManager).where(SiteManager.user_id == user_id, SiteManager.company_id == company.id))).one()
        if mobile_only and emp is None:
            continue
        role = "site_manager" if manages else ("admin" if any(r in ("owner", "branch_admin", "viewer") for r in roles) else "employee")
        out.append(CompanyBrief(id=company.id, name=company.name, initials=initials(company.name), color=color_for(company.id), role=role))
    return out


async def build_profile(session: AsyncSession, user: User, company_id: UUID | None) -> UserProfileOut:
    base = UserProfileOut(id=user.id, name=user.full_name, email=user.email, phone=user.phone, locale=user.locale)
    if company_id is None:
        return base
    emp = (await session.exec(select(Employee).where(Employee.company_id == company_id, Employee.user_id == user.id))).first()
    if emp is None:
        return base
    branch = await session.get(Branch, emp.branch_id)
    sites = (await session.exec(select(Site).join(EmployeeSite, EmployeeSite.site_id == Site.id).where(EmployeeSite.employee_id == emp.id))).all()
    manager = None
    if sites:
        manager = (
            await session.exec(select(User).join(SiteManager, SiteManager.user_id == User.id).where(SiteManager.site_id == sites[0].id, User.id != user.id))
        ).first()
    manages = (await session.exec(select(func.count()).select_from(SiteManager).where(SiteManager.user_id == user.id, SiteManager.company_id == company_id))).one()
    return UserProfileOut(
        id=user.id,
        name=user.full_name,
        employee_no=emp.employee_no,
        title=emp.job_title,
        branch=branch.name if branch else None,
        email=user.email,
        phone=user.phone,
        role="site_manager" if manages else "employee",
        site_ids=[s.id for s in sites],
        site_names=[s.name for s in sites],
        manager_name=manager.full_name if manager else None,
        manager_phone=manager.phone if manager else None,
        locale=user.locale,
    )


def _check_not_locked(user: User) -> None:
    if user.locked_until and user.locked_until > datetime.now(UTC):
        raise RateLimited("Too many failed attempts. Try again later.", code="ACCOUNT_LOCKED")


# --- signup / email verification -----------------------------------------------------------------------


async def signup(session: AsyncSession, body: SignupIn) -> None:
    if not body.accept_terms:
        raise ValidationFailed("Terms must be accepted")
    email = body.email.lower()
    existing = await find_user(session, "email", email)
    if existing and existing.email_verified:
        raise Conflict("An account with this email already exists", code="EMAIL_TAKEN")
    phone = None
    if body.phone:
        _, phone = normalize_identifier(body.phone)
    if existing:  # unverified earlier attempt: let them retry
        user = existing
        user.password_hash = hash_password(body.password)
        user.full_name = body.full_name
    else:
        user = User(full_name=body.full_name, email=email, phone=phone, password_hash=hash_password(body.password), locale=body.locale)
        session.add(user)
        await session.flush()
        company = Company(name=body.company_name, locale=body.locale, trial_ends_at=datetime.now(UTC) + timedelta(days=30))
        session.add(company)
        await session.flush()
        session.add(CompanyMember(company_id=company.id, user_id=user.id, is_owner=True, status="active"))
        roles = await seed_company_roles(session, company.id)
        await assign_role(session, company.id, user.id, roles["owner"], "company")
    code = f"{secrets.randbelow(10**6):06d}"
    await get_redis().set(f"emailcode:{email}", sha256(code + str(user.id)), ex=900)
    await notify("email", email, f"Your StaffSync verification code is {code}", subject="Verify your email", code=code)


async def verify_email(session: AsyncSession, email: str, code: str, *, ip: str | None, ua: str | None) -> TokenPair:
    email = email.lower()
    user = await find_user(session, "email", email)
    r = get_redis()
    attempts_key = f"emailcode:attempts:{email}"
    if user is None:
        raise ValidationFailed("Invalid code", code="OTP_INVALID")
    if int(await r.get(attempts_key) or 0) >= 5:
        raise RateLimited("Too many attempts", code="OTP_LOCKED")
    stored = await r.get(f"emailcode:{email}")
    if stored is None:
        raise ValidationFailed("Code expired", code="OTP_EXPIRED")
    if stored != sha256(code + str(user.id)):
        await r.incr(attempts_key)
        await r.expire(attempts_key, 900)
        raise ValidationFailed("Invalid code", code="OTP_INVALID")
    await r.delete(f"emailcode:{email}", attempts_key)
    user.email_verified = True
    user.last_login_at = datetime.now(UTC)
    member = (await session.exec(select(CompanyMember).where(CompanyMember.user_id == user.id, CompanyMember.is_owner.is_(True)))).first()  # type: ignore[attr-defined]
    return await issue_tokens(session, user_id=user.id, company_id=member.company_id if member else None, ip=ip, user_agent=ua)


# --- password login + MFA -------------------------------------------------------------------------------


async def login(session: AsyncSession, email: str, password: str, *, trusted_cookie: str | None, remember: bool, ip: str | None, ua: str | None) -> LoginOut:
    user = await find_user(session, "email", email.lower())
    if user is not None:
        _check_not_locked(user)
    if user is None or not verify_password(password, user.password_hash):
        if user is not None:
            await _register_failure(user.id)
        raise Unauthenticated("Invalid email or password", code="INVALID_CREDENTIALS")
    if user.status != "active":
        raise AccountError("This account has been deactivated")
    if not user.email_verified:
        raise Forbidden("Verify your email first", code="EMAIL_NOT_VERIFIED")
    user.failed_logins = 0
    companies = await user_companies(session, user.id)
    if not companies:
        raise AccountError("No active workspace for this account")
    if user.totp_enabled:
        trusted = False
        if trusted_cookie:
            try:
                trusted = read_ticket("trust", trusted_cookie) == str(user.id)
            except Unauthenticated:
                trusted = False
        if not trusted:
            return LoginOut(mfa_required=True, mfa_ticket=sign_ticket("mfa", str(user.id), 300))
    return await finish_login(session, user, companies, ip=ip, ua=ua)


async def _register_failure(user_id: UUID) -> None:
    """Failed-login counters must persist even though the request ends in an error (which rolls back its transaction)."""
    from staffsync.core.db import session_scope

    async with session_scope(bypass=True) as s2:
        row = await s2.get(User, user_id)
        if row is None:
            return
        row.failed_logins += 1
        if row.failed_logins >= MAX_FAILED:
            row.locked_until = datetime.now(UTC) + timedelta(minutes=LOCK_MIN)
            row.failed_logins = 0


async def finish_login(session: AsyncSession, user: User, companies: list[CompanyBrief], *, ip: str | None, ua: str | None) -> LoginOut:
    user.last_login_at = datetime.now(UTC)
    last = (await session.exec(select(CompanyMember).where(CompanyMember.user_id == user.id, CompanyMember.status == "active").order_by(CompanyMember.last_active_at.desc().nullslast()))).first()  # type: ignore[union-attr]
    cid = last.company_id if last else companies[0].id
    tokens = await issue_tokens(session, user_id=user.id, company_id=cid, ip=ip, user_agent=ua)
    return LoginOut(tokens=tokens, companies=companies)


async def mfa_verify(session: AsyncSession, ticket: str, code: str, trust: bool, *, ip: str | None, ua: str | None) -> tuple[LoginOut, str | None]:
    user_id = UUID(read_ticket("mfa", ticket))
    user = await session.get(User, user_id)
    if user is None or not user.totp_enabled or not user.totp_secret:
        raise Unauthenticated("Invalid ticket")
    _check_not_locked(user)
    ok = verify_totp(decrypt_field(user.totp_secret), code)
    if not ok:
        hashed = hashlib.sha256(code.strip().upper().encode()).hexdigest()
        codes = list(user.backup_codes or [])
        if hashed in codes:
            codes.remove(hashed)
            user.backup_codes = codes
            ok = True
    if not ok:
        raise Unauthenticated("Invalid code", code="MFA_INVALID")
    out = await finish_login(session, user, await user_companies(session, user.id), ip=ip, ua=ua)
    return out, sign_ticket("trust", str(user.id), 30 * 86400) if trust else None


# --- mobile OTP --------------------------------------------------------------------------------------


async def otp_request(session: AsyncSession, identifier: str) -> int:
    s = get_settings()
    kind, value = normalize_identifier(identifier)
    user = await find_user(session, kind, value)
    if user is None:
        raise NotFound("Account not found, contact your admin", code="ACCOUNT_NOT_FOUND")
    if user.status != "active":
        raise AccountError("This account has been deactivated")
    if not await user_companies(session, user.id, mobile_only=True):
        raise NotFound("Account not found, contact your admin", code="ACCOUNT_NOT_FOUND")
    r = get_redis()
    if await r.exists(f"otp:cool:{value}"):
        raise RateLimited("Please wait before requesting another code", code="OTP_RESEND_WAIT", retry_after=await r.ttl(f"otp:cool:{value}"))
    day_key = f"otp:day:{value}:{datetime.now(UTC):%Y%m%d}"
    if int(await r.incr(day_key)) > s.otp_daily_cap:
        raise RateLimited("Daily code limit reached", code="OTP_DAILY_CAP")
    await r.expire(day_key, 86400)
    code = f"{secrets.randbelow(10**6):06d}"
    await r.hset(f"otp:{value}", mapping={"h": sha256(code + str(user.id)), "attempts": 0})
    await r.expire(f"otp:{value}", s.otp_ttl_s)
    await r.set(f"otp:cool:{value}", "1", ex=s.otp_resend_s)
    await notify("sms" if kind == "phone" else "email", value, f"Your StaffSync code is {code}", subject="Your login code", code=code)
    return s.otp_resend_s


async def otp_verify(session: AsyncSession, identifier: str, code: str, device_id: str | None, *, ip: str | None, ua: str | None) -> OtpVerifyOut:
    s = get_settings()
    kind, value = normalize_identifier(identifier)
    user = await find_user(session, kind, value)
    r = get_redis()
    data = await r.hgetall(f"otp:{value}")  # type: ignore[misc]
    if user is None or not data:
        raise ValidationFailed("Code expired", code="OTP_EXPIRED")
    attempts = int(data.get("attempts", 0))
    if attempts >= s.otp_max_attempts:
        raise RateLimited("Too many attempts", code="OTP_LOCKED", attempts_left=0)
    if data["h"] != sha256(code + str(user.id)):
        attempts = await r.hincrby(f"otp:{value}", "attempts", 1)  # type: ignore[misc]
        if attempts >= s.otp_max_attempts:
            raise RateLimited("Too many attempts", code="OTP_LOCKED", attempts_left=0)
        raise ValidationFailed("Invalid code", code="OTP_INVALID", attempts_left=s.otp_max_attempts - attempts)
    await r.delete(f"otp:{value}")
    if user.status != "active":
        raise AccountError("This account has been deactivated")
    companies = await user_companies(session, user.id, mobile_only=True)
    if not companies:
        raise AccountError("This account has been deactivated")
    cid = companies[0].id if len(companies) == 1 else None
    user.last_login_at = datetime.now(UTC)
    tokens = await issue_tokens(
        session, user_id=user.id, company_id=cid, channel="mobile", device_hash=hash_device_id(device_id) if device_id else None, ip=ip, user_agent=ua
    )
    emp_ids = (await session.exec(select(Employee).where(Employee.user_id == user.id, Employee.status == "invited"))).all()
    for e in emp_ids:  # first successful login activates an invited employee
        e.status = "active"
    return OtpVerifyOut(companies=companies, tokens=tokens, user=await build_profile(session, user, cid))


async def select_company(session: AsyncSession, ctx: RequestContext, company_id: UUID, *, ip: str | None, ua: str | None) -> tuple[TokenPair, UserProfileOut]:
    member = (await session.exec(select(CompanyMember).where(CompanyMember.user_id == ctx.user.id, CompanyMember.company_id == company_id, CompanyMember.status == "active"))).first()
    if member is None:
        raise NotFound("Company not found")
    member.last_active_at = datetime.now(UTC)
    old = (await session.exec(select(RefreshToken).where(RefreshToken.family_id == ctx.session_id).limit(1))).first()
    channel = old.channel if old else "web"
    await revoke_family(session, ctx.session_id)
    pair = await issue_tokens(session, user_id=ctx.user.id, company_id=company_id, channel=channel, device_hash=ctx.device_hash, ip=ip, user_agent=ua)
    return pair, await build_profile(session, ctx.user, company_id)


# --- password reset / invitations ---------------------------------------------------------------------


async def forgot_password(session: AsyncSession, email: str) -> None:
    user = await find_user(session, "email", email.lower())
    if user is None or user.status != "active":
        return  # same response either way
    token = new_opaque_token()
    await get_redis().set(f"pwreset:{sha256(token)}", str(user.id), ex=3600)
    link = f"{get_settings().dashboard_url}/reset-password?token={token}"
    await notify("email", user.email or "", f"Reset your StaffSync password: {link}", subject="Reset your password", token=token, link=link)


async def reset_password(session: AsyncSession, token: str, password: str) -> None:
    r = get_redis()
    uid = await r.getdel(f"pwreset:{sha256(token)}")
    if not uid:
        raise Unauthenticated("Invalid or expired reset link", code="INVALID_TOKEN")
    user = await session.get(User, UUID(uid))
    if user is None:
        raise Unauthenticated("Invalid or expired reset link", code="INVALID_TOKEN")
    user.password_hash = hash_password(password)
    user.failed_logins = 0
    user.locked_until = None
    await revoke_user_sessions(session, user.id)


async def accept_invitation(session: AsyncSession, token: str, password: str, full_name: str | None, *, ip: str | None, ua: str | None) -> TokenPair:
    inv = (await session.exec(select(Invitation).where(Invitation.token_hash == sha256(token)))).first()
    if inv is None or inv.accepted_at is not None:
        raise NotFound("Invitation not found", code="INVITE_INVALID")
    if inv.expires_at < datetime.now(UTC):
        raise Forbidden("This invitation has expired. Ask for a new one.", code="INVITE_EXPIRED")
    user = await session.get(User, inv.user_id)
    assert user is not None
    if user.password_hash is None:  # existing accounts keep their password
        user.password_hash = hash_password(password)
    user.email_verified = True
    if full_name:
        user.full_name = full_name
    member = (await session.exec(select(CompanyMember).where(CompanyMember.user_id == user.id, CompanyMember.company_id == inv.company_id))).first()
    if member:
        member.status = "active"
    inv.accepted_at = datetime.now(UTC)
    return await issue_tokens(session, user_id=user.id, company_id=inv.company_id, ip=ip, user_agent=ua)


async def invitation_preview(session: AsyncSession, token: str) -> dict:
    inv = (await session.exec(select(Invitation).where(Invitation.token_hash == sha256(token)))).first()
    if inv is None or inv.accepted_at is not None:
        raise NotFound("Invitation not found", code="INVITE_INVALID")
    company = await session.get(Company, inv.company_id)
    inviter = await session.get(User, inv.invited_by) if inv.invited_by else None
    role = await session.get(Role, inv.role_id) if inv.role_id else None
    user = await session.get(User, inv.user_id)
    return {
        "company": company.name if company else None,
        "invited_by": inviter.full_name if inviter else None,
        "role": role.name if role else None,
        "email": user.email if user else None,
        "expired": inv.expires_at < datetime.now(UTC),
    }


# --- account (me) ---------------------------------------------------------------------------------------


async def change_password(session: AsyncSession, ctx: RequestContext, current: str, new: str) -> None:
    if not verify_password(current, ctx.user.password_hash):
        raise Forbidden("Current password is incorrect", code="INVALID_CREDENTIALS")
    ctx.user.password_hash = hash_password(new)
    await revoke_user_sessions(session, ctx.user.id, except_family=ctx.session_id)


async def mfa_setup(ctx: RequestContext) -> tuple[str, str]:
    secret = new_totp_secret()
    await get_redis().set(f"mfa:setup:{ctx.user.id}", encrypt_field(secret), ex=900)
    return secret, totp_uri(secret, ctx.user.email or str(ctx.user.id))


async def mfa_enable(ctx: RequestContext, code: str) -> list[str]:
    stored = await get_redis().get(f"mfa:setup:{ctx.user.id}")
    if not stored:
        raise ValidationFailed("Start the setup again", code="MFA_SETUP_EXPIRED")
    secret = decrypt_field(stored)
    if not verify_totp(secret, code):
        raise ValidationFailed("Invalid code", code="MFA_INVALID")
    plain = [secrets.token_hex(4).upper() for _ in range(8)]
    ctx.user.totp_secret = encrypt_field(secret)
    ctx.user.totp_enabled = True
    ctx.user.backup_codes = [hashlib.sha256(c.encode()).hexdigest() for c in plain]
    await get_redis().delete(f"mfa:setup:{ctx.user.id}")
    return plain


async def mfa_disable(ctx: RequestContext, password: str) -> None:
    if not verify_password(password, ctx.user.password_hash):
        raise Forbidden("Password is incorrect", code="INVALID_CREDENTIALS")
    ctx.user.totp_enabled = False
    ctx.user.totp_secret = None
    ctx.user.backup_codes = None


async def list_sessions(session: AsyncSession, ctx: RequestContext) -> list[RefreshToken]:
    rows = (
        await session.exec(
            select(RefreshToken)
            .where(RefreshToken.user_id == ctx.user.id, RefreshToken.revoked_at.is_(None), RefreshToken.rotated_at.is_(None), RefreshToken.expires_at > datetime.now(UTC))  # type: ignore[union-attr]
            .order_by(RefreshToken.created_at.desc())  # type: ignore[attr-defined]
        )
    ).all()
    return list(rows)
