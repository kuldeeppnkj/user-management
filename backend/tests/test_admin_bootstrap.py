import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.models import User, UserRole
from scripts.create_admin import create_admin_account


def test_admin_bootstrap_normalizes_email_and_hashes_password(db_session: Session) -> None:
    created = create_admin_account("Owner@Example.com", "secure-admin-password-123", db_session)
    user = db_session.scalar(select(User).where(User.email == "owner@example.com"))

    assert created is True
    assert user is not None
    assert user.role == UserRole.ADMIN
    assert user.password_hash != "secure-admin-password-123"
    assert verify_password("secure-admin-password-123", user.password_hash)


def test_admin_bootstrap_rejects_duplicate_and_short_password(db_session: Session) -> None:
    assert create_admin_account("owner@example.com", "secure-admin-password-123", db_session) is True
    assert create_admin_account("OWNER@example.com", "another-secure-password-456", db_session) is False

    with pytest.raises(ValueError):
        create_admin_account("second@example.com", "short", db_session)