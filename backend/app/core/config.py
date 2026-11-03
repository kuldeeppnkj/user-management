from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEVELOPMENT_SECRET = "development-only-secret-change-before-deploying"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "User Management API"
    app_env: Literal["development", "production"] = "development"
    database_url: str = (
        "mysql+pymysql://user_management:change-me@localhost:3306/user_management"
    )
    secret_key: str = DEVELOPMENT_SECRET
    access_token_expire_minutes: int = 30
    cors_origins: str = ""

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.access_token_expire_minutes < 1:
            raise ValueError("ACCESS_TOKEN_EXPIRE_MINUTES must be positive")
        if self.app_env == "production" and (
            self.secret_key == DEVELOPMENT_SECRET or len(self.secret_key) < 32
        ):
            raise ValueError("Production requires a unique SECRET_KEY of at least 32 characters")
        if self.app_env == "production" and "change-me" in self.database_url.lower():
            raise ValueError("Production requires non-placeholder database credentials")
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()