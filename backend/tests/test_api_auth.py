from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.models.user import User


def test_register(client: TestClient, db_session: Session):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "password123",
            "name": "New User",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data
    assert "password_hash" not in data

    # Verify user exists in db and password is hashed
    user = db_session.query(User).filter_by(email="newuser@example.com").first()
    assert user is not None
    assert verify_password("password123", user.password_hash)


def test_register_duplicate(client: TestClient, test_user: User):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": test_user.email,
            "password": "password123",
            "name": "Another User",
        },
    )
    assert response.status_code == 400


def test_login(client: TestClient, test_user: User):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": test_user.email, "password": "testpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid(client: TestClient, test_user: User):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": test_user.email, "password": "wrongpassword"},
    )
    assert response.status_code == 400


def test_read_me(client: TestClient, test_user_token: str, test_user: User):
    response = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {test_user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email


def test_read_me_unauthorized(client: TestClient):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
