"""Application configuration loaded from environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings.

    All values are read from environment variables (or a .env file).
    Never hardcode secrets — use the .env.example file as a reference.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─── Database ─────────────────────────────────────────────────────────────
    database_url: str = "postgresql://postgres:changeme@localhost:5432/darukaa"
    test_database_url: str = "postgresql://postgres:changeme@localhost:5432/darukaa_test"

    # ─── JWT (architectural scaffold — not yet wired into auth endpoints) ─────
    jwt_secret_key: str = "CHANGE_ME_USE_A_STRONG_RANDOM_SECRET"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # ─── CORS ─────────────────────────────────────────────────────────────────
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # ─── App ──────────────────────────────────────────────────────────────────
    app_env: str = "development"
    debug: bool = False


@lru_cache
def get_settings() -> Settings:
    """
    Return a cached Settings instance.
    Use this as a FastAPI dependency: Depends(get_settings).
    """
    return Settings()
