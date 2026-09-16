from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.user import User


def test_create_project(client: TestClient, test_user_token: str, test_user: User):
    response = client.post(
        "/api/v1/projects",
        headers={"Authorization": f"Bearer {test_user_token}"},
        json={
            "name": "API Test Project",
            "project_type": "afforestation",
            "status": "planning",
            "owner_id": str(test_user.id),
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "API Test Project"
    assert data["owner_id"] == str(test_user.id)


def test_create_project_assigns_authenticated_owner(
    client: TestClient, test_user_token: str, test_user: User
):
    response = client.post(
        "/api/v1/projects",
        headers={"Authorization": f"Bearer {test_user_token}"},
        json={
            "name": "Authenticated Project",
            "project_type": "afforestation",
            "status": "planning",
        },
    )
    assert response.status_code == 201
    assert response.json()["owner_id"] == str(test_user.id)


def test_create_project_unauthorized(client: TestClient, test_user_token: str):
    import uuid

    response = client.post(
        "/api/v1/projects",
        headers={"Authorization": f"Bearer {test_user_token}"},
        json={
            "name": "API Test Project",
            "project_type": "afforestation",
            "status": "planning",
            "owner_id": str(uuid.uuid4()),  # Someone else's ID
        },
    )
    assert response.status_code == 403


def test_list_projects(
    client: TestClient, test_user_token: str, test_user: User, db_session: Session
):
    # Add project directly to DB
    proj = Project(
        name="Proj1", owner_id=test_user.id, project_type="other", status="active"
    )
    db_session.add(proj)
    db_session.commit()

    response = client.get(
        "/api/v1/projects", headers={"Authorization": f"Bearer {test_user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 1
    assert any(p["name"] == "Proj1" for p in data["items"])


def test_get_project(
    client: TestClient, test_user_token: str, test_user: User, db_session: Session
):
    proj = Project(
        name="ProjGet", owner_id=test_user.id, project_type="other", status="active"
    )
    db_session.add(proj)
    db_session.commit()

    response = client.get(
        f"/api/v1/projects/{proj.id}",
        headers={"Authorization": f"Bearer {test_user_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "ProjGet"


def test_get_project_wrong_owner(
    client: TestClient, test_user_token: str, db_session: Session
):
    import uuid

    other_user = User(
        id=uuid.uuid4(), email="other@example.com", password_hash="hash", name="Other"
    )
    db_session.add(other_user)
    db_session.commit()

    proj = Project(
        name="ProjSecret", owner_id=other_user.id, project_type="other", status="active"
    )
    db_session.add(proj)
    db_session.commit()

    response = client.get(
        f"/api/v1/projects/{proj.id}",
        headers={"Authorization": f"Bearer {test_user_token}"},
    )
    assert response.status_code == 403
