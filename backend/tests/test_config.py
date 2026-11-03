import pytest
from pydantic import ValidationError

from app.core.config import DEVELOPMENT_SECRET, Settings


def test_production_rejects_development_secret() -> None:
    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            app_env="production",
            secret_key=DEVELOPMENT_SECRET,
            cors_origins="https://app.example.com",
        )


def test_production_rejects_placeholder_database_credentials() -> None:
    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            app_env="production",
            secret_key="a-unique-production-secret-with-at-least-32-characters",
            database_url="mysql+pymysql://user:change-me@db.example.com/user_management",
        )


def test_production_accepts_unique_secret_and_parses_origins() -> None:
    settings = Settings(
        _env_file=None,
        app_env="production",
        database_url="mysql+pymysql://app-user:secure-password@db.example.com/user_management",
        secret_key="a-unique-production-secret-with-at-least-32-characters",
        cors_origins="https://app.example.com/, https://admin.example.com",
    )

    assert settings.cors_origin_list == [
        "https://app.example.com",
        "https://admin.example.com",
    ]