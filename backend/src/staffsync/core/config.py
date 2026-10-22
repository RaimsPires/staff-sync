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

    s3_bucket: str | None = None
    s3_endpoint_url: str | None = None
    dashboard_url: str = "http://localhost:3000"
    sentry_dsn: str | None = None

    @property
    def is_prod(self) -> bool:
        return self.app_env == "prod"


@lru_cache
def get_settings() -> Settings:
    return Settings()
