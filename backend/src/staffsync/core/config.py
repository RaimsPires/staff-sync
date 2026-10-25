from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: Literal["dev", "test", "staging", "prod"] = "dev"
    api_prefix: str = "/api/v1"

    database_url: str = "postgresql+asyncpg://staffsync_app:staffsync_app@localhost:5433/staffsync"
    migration_database_url: str = "postgresql+asyncpg://staffsync:staffsync@localhost:5433/staffsync"
    redis_url: str = "redis://localhost:6380/0"

    # Tokens. In dev an Ed25519 key is derived from jwt_secret; set jwt_private_key_pem in production.
    jwt_secret: str = "dev-only-secret-change-me-dev-only-secret"
    jwt_private_key_pem: str | None = None
    jwt_key_id: str = "k1"
    access_ttl_min: int = 15
    refresh_ttl_days_mobile: int = 30
    refresh_ttl_days_web: int = 7
    server_pepper: str = "dev-pepper"
    field_encryption_key: str | None = None

    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    app_version_min: str | None = None

    otp_ttl_s: int = 300
    otp_max_attempts: int = 5
    otp_resend_s: int = 60
    otp_daily_cap: int = 10

    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None
    stripe_prices: dict[str, str] = Field(default_factory=dict)  # e.g. {"starter_month": "price_..."}
    billing_grace_days: int = 7

    # Public address of this API, as the phone and the browser reach it. Used in links the API hands out
    # (local upload/download URLs, the SSO callback). Defaults to the dev server.
    public_api_url: str = "http://localhost:8000"
    dashboard_url: str = "http://localhost:3000"
    sentry_dsn: str | None = None

    # Object storage. With s3_bucket set, files go to S3 / any S3-compatible store (R2, MinIO, Spaces);
    # otherwise they are kept on local disk under local_storage_dir (development only).
    s3_bucket: str | None = None
    s3_endpoint_url: str | None = None
    s3_region: str | None = None
    s3_access_key_id: str | None = None
    s3_secret_access_key: str | None = None
    local_storage_dir: str = "./.storage"

    # E-mail over SMTP. Leave smtp_host empty to only log e-mails to the console.
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str = "no-reply@staffsync.app"
    smtp_from_name: str = "StaffSync"
    smtp_starttls: bool = True  # port 587
    smtp_ssl: bool = False  # implicit TLS, port 465

    # SMS. sms_provider: console | twilio | africastalking
    sms_provider: Literal["console", "twilio", "africastalking"] = "console"
    twilio_account_sid: str | None = None
    twilio_auth_token: str | None = None
    twilio_from: str | None = None  # a number or alphanumeric sender
    twilio_messaging_service_sid: str | None = None  # used instead of twilio_from when set
    africastalking_username: str | None = None  # "sandbox" for the sandbox
    africastalking_api_key: str | None = None
    africastalking_sender_id: str | None = None

    # Push notifications go through Expo's push service (it talks to APNs and FCM for the app).
    expo_push_enabled: bool = False
    expo_access_token: str | None = None  # only if enhanced push security is on in your Expo project

    # Single sign-on for the dashboard (leave the client ids empty to switch a provider off).
    google_client_id: str | None = None
    google_client_secret: str | None = None
    microsoft_client_id: str | None = None
    microsoft_client_secret: str | None = None
    microsoft_tenant: str = "common"  # a tenant id, "organizations" or "common"

    # App attestation. Verdicts only add a flag; they never block a check-in on their own.
    play_integrity_package_name: str | None = None  # e.g. app.staffsync.mobile
    google_service_account_file: str | None = None  # service account JSON with the Play Integrity API enabled
    apple_app_id: str | None = None  # "<TEAM_ID>.<bundle id>", for App Attest

    @property
    def is_prod(self) -> bool:
        return self.app_env == "prod"


@lru_cache
def get_settings() -> Settings:
    return Settings()
