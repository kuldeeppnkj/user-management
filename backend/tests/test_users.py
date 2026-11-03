from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import User, UserRole


def admin_headers(client: TestClient, session: Session) -> dict[str, str]:
    session.add(
        User(
            email="admin@example.com",
            password_hash=hash_password("admin-password-123"),
            role=UserRole.ADMIN,
        )
    )
    session.commit()
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "admin-password-123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_admin_can_manage_users_and_user_cannot(client: TestClient, db_session: Session) -> None:
    regular_user = client.post(
        "/api/v1/auth/register",
        json={"email": "person@example.com", "password": "long-password-123"},
    ).json()
    user_token = client.post(
        "/api/v1/auth/login",
        json={"email": "person@example.com", "password": "long-password-123"},
    ).json()["access_token"]
    assert client.get(
        "/api/v1/users", headers={"Authorization": f"Bearer {user_token}"}
    ).status_code == 403

    headers = admin_headers(client, db_session)
    created = client.post(
        "/api/v1/users",
        headers=headers,
        json={"email": "new@example.com", "password": "another-password-123", "role": "admin"},
    )
    assert created.status_code == 201
    assert created.json()["role"] == "admin"

    listing = client.get("/api/v1/users?q=person&is_active=true", headers=headers)
    assert listing.status_code == 200
    assert listing.json()["total"] == 1
    assert listing.json()["items"][0]["id"] == regular_user["id"]

    deactivated = client.delete(f"/api/v1/users/{regular_user['id']}", headers=headers)
    assert deactivated.status_code == 200
    assert deactivated.json()["is_active"] is False

    reactivated = client.patch(
        f"/api/v1/users/{regular_user['id']}", headers=headers, json={"is_active": True}
    )
    assert reactivated.status_code == 200
    assert reactivated.json()["is_active"] is True


def test_admin_cannot_deactivate_or_demote_self(client: TestClient, db_session: Session) -> None:
    headers = admin_headers(client, db_session)
    admin_id = db_session.query(User).filter_by(email="admin@example.com").one().id

    assert client.delete(f"/api/v1/users/{admin_id}", headers=headers).status_code == 400
    response = client.patch(
        f"/api/v1/users/{admin_id}", headers=headers, json={"role": "user"}
    )
    assert response.status_code == 400