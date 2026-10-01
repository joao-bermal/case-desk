from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://casedesk:casedesk@localhost:5433/casedesk"
    # Base URL of the web app, used to build links in emails.
    web_base_url: str = "http://localhost:3000"

    session_ttl_hours: int = 12
    reset_token_ttl_minutes: int = 30
    invite_token_ttl_hours: int = 72
    max_failed_logins: int = 5
    lockout_minutes: int = 15

    # Public demo: one-click sign in as each role, daily reset, row caps.
    demo_mode: bool = False
    # Vercel Cron sends it as a bearer token to the reset endpoint.
    cron_secret: str = ""

    # Without SMTP_HOST, emails are written to the log instead of sent.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_starttls: bool = True
    mail_from: str = "Case Desk <no-reply@casedesk.example>"

    @field_validator("database_url")
    @classmethod
    def use_psycopg_driver(cls, value: str) -> str:
        # Hosting providers hand out postgres:// URLs; SQLAlchemy needs the driver name.
        for prefix in ("postgres://", "postgresql://"):
            if value.startswith(prefix):
                return "postgresql+psycopg://" + value.removeprefix(prefix)
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
