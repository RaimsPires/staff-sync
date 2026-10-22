from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from staffsync.modules.auth.tokens import TokenPair


class SignupIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
    phone: str | None = None
    company_name: str = Field(default="My company", min_length=2, max_length=120)
    accept_terms: bool
    locale: str = "en"


class SignupOut(BaseModel):
    email: str
    verification_sent: bool = True


class VerifyEmailIn(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)


class LoginIn(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False


class CompanyBrief(BaseModel):
    id: UUID
    name: str
    initials: str
    color: str
    role: str  # employee | site_manager | admin


class LoginOut(BaseModel):
    mfa_required: bool = False
    mfa_ticket: str | None = None
    tokens: TokenPair | None = None
    companies: list[CompanyBrief] = []


class MfaVerifyIn(BaseModel):
    mfa_ticket: str
    code: str
    trust_device: bool = False


class OtpRequestIn(BaseModel):
    identifier: str = Field(min_length=3, max_length=200)


class OtpRequestOut(BaseModel):
    sent: bool = True
    resend_after_s: int


class OtpVerifyIn(BaseModel):
    identifier: str
    code: str = Field(min_length=6, max_length=6)
    device_id: str | None = None


class SelectCompanyIn(BaseModel):
    company_id: UUID


class RefreshIn(BaseModel):
    refresh_token: str | None = None


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    password: str = Field(min_length=10, max_length=128)


class AcceptInviteIn(BaseModel):
    password: str = Field(min_length=10, max_length=128)
    full_name: str | None = None


class MeUpdateIn(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    locale: str | None = Field(default=None, pattern="^(en|fr)$")
    theme: str | None = Field(default=None, pattern="^(light|dark|system)$")
    notification_prefs: dict | None = None


class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=10, max_length=128)


class MfaSetupOut(BaseModel):
    secret: str
    otpauth_uri: str


class MfaEnableIn(BaseModel):
    code: str


class MfaEnableOut(BaseModel):
    backup_codes: list[str]


class MfaDisableIn(BaseModel):
    password: str


class SessionOut(BaseModel):
    id: UUID
    channel: str
    ip: str | None
    user_agent: str | None
    created_at: datetime
    last_used_at: datetime | None
    current: bool = False


class UserProfileOut(BaseModel):
    """Mobile-friendly profile (camelCase keys are produced by the client mappers; the API stays snake_case)."""

    id: UUID
    name: str
    employee_no: str | None = None
    title: str | None = None
    branch: str | None = None
    email: str | None = None
    phone: str | None = None
    role: str = "employee"
    site_ids: list[UUID] = []
    site_names: list[str] = []
    manager_name: str | None = None
    manager_phone: str | None = None
    photo_url: str | None = None
    locale: str = "en"


class OtpVerifyOut(BaseModel):
    companies: list[CompanyBrief]
    tokens: TokenPair
    user: UserProfileOut | None = None


class MeOut(BaseModel):
    id: UUID
    full_name: str
    email: str | None
    phone: str | None
    locale: str
    theme: str
    totp_enabled: bool
    company_id: UUID | None
    companies: list[CompanyBrief]
    roles: list[str]
    permissions: list[str]
    scope: dict
    employee_id: UUID | None = None
