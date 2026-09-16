from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.site import Site
from app.models.user import User


def test_create_site(
    client: TestClient, test_user_token: str, test_user: User, db_session: Session
):
    proj = Project(
        name="SiteProj", owner_id=test_user.id, project_type="other", status="active"
    )
    db_session.add(proj)
    db_session.commit()

    response = client.post(
        "/api/v1/sites",
        headers={"Authorization": f"Bearer {test_user_token}"},
        json={
            "name": "API Test Site",
            "project_id": str(proj.id),
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
            },
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "API Test Site"
    assert data["project_id"] == str(proj.id)


def test_get_map(
    client: TestClient, test_user_token: str, test_user: User, db_session: Session
):
    proj = Project(
        name="MapProj", owner_id=test_user.id, project_type="other", status="active"
    )
    db_session.add(proj)
    db_session.commit()

    site = Site(
        name="MapSite",
        project_id=proj.id,
        geometry="SRID=4326;POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))",
        area_hectares=1.5,
    )
    db_session.add(site)
    db_session.commit()

    response = client.get(
        "/api/v1/sites/map", headers={"Authorization": f"Bearer {test_user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 1
    assert data["features"][0]["properties"]["name"] == "MapSite"
    assert data["features"][0]["properties"]["project_id"] == str(proj.id)
    assert data["features"][0]["properties"]["project_name"] == "MapProj"
