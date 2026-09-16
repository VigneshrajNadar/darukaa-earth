from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.site import Site
from app.models.user import User


def test_get_dashboard_summary(
    client: TestClient, test_user_token: str, test_user: User, db_session: Session
):
    # Empty state first
    response = client.get(
        "/api/v1/dashboard/summary",
        headers={"Authorization": f"Bearer {test_user_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_projects"] == 0
    assert data["total_sites"] == 0
    assert data["total_area_hectares"] == 0.0

    # Add data
    proj = Project(
        name="DashProj", owner_id=test_user.id, project_type="other", status="active"
    )
    db_session.add(proj)
    db_session.commit()

    site = Site(
        name="DashSite",
        project_id=proj.id,
        geometry="SRID=4326;POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))",
        area_hectares=10.5,
    )
    db_session.add(site)
    db_session.commit()

    response = client.get(
        "/api/v1/dashboard/summary",
        headers={"Authorization": f"Bearer {test_user_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_projects"] == 1
    assert data["total_sites"] == 1
    assert data["total_area_hectares"] == 10.5
