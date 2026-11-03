from fastapi.testclient import TestClient


def test_register_login_and_read_profile(client: TestClient) -> None:
    registration = client.post(
        "/api/v1/auth/register",
        json={"email": "Person@Example.com", "password": "long-password-123", "full_name": "Test Person"},
    )

    assert registration.status_code == 201
    user = registration.json()
    assert user["email"] == "person@example.com"
    assert user["role"] == "user"
    assert "password_hash" not in user

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "person@example.com", "password": "long-password-123"},
    )
    assert login.status_code == 200
    assert login.json()["token_type"] == "bearer"

    profile = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )
    assert profile.status_code == 200
    assert profile.json()["email"] == "person@example.com"


def test_duplicate_registration_and_invalid_login(client: TestClient) -> None:
    body = {"email": "person@example.com", "password": "long-password-123"}
    assert client.post("/api/v1/auth/register", json=body).status_code == 201
    assert client.post("/api/v1/auth/register", json=body).status_code == 409
    assert client.post(
        "/api/v1/auth/login",
        json={"email": body["email"], "password": "incorrect-password"},
    ).status_code == 401
    assert client.post(
        "/api/v1/auth/login",
        json={"email": "missing@example.com", "password": "incorrect-password"},
    ).status_code == 401


def test_password_change_revokes_old_tokens(client: TestClient) -> None:
    client.post(
        "/api/v1/auth/register",
        json={"email": "password-change@example.com", "password": "initial-password-123"},
    )
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "password-change@example.com", "password": "initial-password-123"},
    )
    old_token = login.json()["access_token"]

    changed = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {old_token}"},
        json={"current_password": "initial-password-123", "new_password": "replacement-password-456"},
    )

    assert changed.status_code == 200
    assert client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {old_token}"}
    ).status_code == 401
    new_token = changed.json()["access_token"]
    assert client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {new_token}"}
    ).status_code == 200
    assert client.post(
        "/api/v1/auth/login",
        json={"email": "password-change@example.com", "password": "initial-password-123"},
    ).status_code == 401
    assert client.post(
        "/api/v1/auth/login",
        json={"email": "password-change@example.com", "password": "replacement-password-456"},
    ).status_code == 200


def test_password_change_requires_current_password(client: TestClient) -> None:
    client.post(
        "/api/v1/auth/register",
        json={"email": "wrong-current@example.com", "password": "initial-password-123"},
    )
    token = client.post(
        "/api/v1/auth/login",
        json={"email": "wrong-current@example.com", "password": "initial-password-123"},
    ).json()["access_token"]

    response = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "incorrect-password", "new_password": "replacement-password-456"},
    )

    assert response.status_code == 400