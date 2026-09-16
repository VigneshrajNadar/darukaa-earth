"""
Tests for domain models, constraints, and geospatial behavior.
"""

import uuid
from datetime import date

import pytest
from geoalchemy2.shape import to_shape
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.enums import ProjectStatus, ProjectType
from app.models.project import Project
from app.models.site import Site
from app.models.site_analytics import SiteAnalytics
from app.models.user import User
from app.repositories.site_repository import SiteRepository
from app.schemas.site import SiteCreate
from app.services.site_service import SiteService, SiteValidationError

# ─── 1. USER & CONSTRAINTS ────────────────────────────────────────────────────────

def test_user_creation(db_session: Session) -> None:
    """Test User model creation."""
    user = User(
        name="Test User",
        email="test@example.com",
        password_hash="hashed_pw_here",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    assert user.id is not None


def test_case_insensitive_email_uniqueness(db_session: Session) -> None:
    """Test LOWER(email) unique index constraint."""
    user1 = User(name="Test 1", email="Test@Example.com", password_hash="hash1")
    db_session.add(user1)
    db_session.commit()

    user2 = User(name="Test 2", email="test@example.com", password_hash="hash2")
    db_session.add(user2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


# ─── 2. RELATIONSHIPS ─────────────────────────────────────────────────────────────

def test_project_site_relationship(db_session: Session) -> None:
    """Test Project to Site relationship and cascade readiness."""
    user = User(name="O", email="o@e.com", password_hash="h")
    project = Project(name="P", project_type=ProjectType.OTHER, status=ProjectStatus.ACTIVE, owner=user)
    db_session.add_all([user, project])
    db_session.commit()

    service = SiteService(SiteRepository(db_session))
    geojson = {"type": "Polygon", "coordinates": [[[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], [0.0, 0.0]]]}
    site = service.create_site(SiteCreate(project_id=project.id, name="Test Site", geometry=geojson))

    db_session.refresh(project)
    assert site.project_id == project.id
    assert len(project.sites) == 1


def test_cascade_deletion(db_session: Session) -> None:
    """Test cascade delete from Project -> Site -> Analytics."""
    user = User(name="O", email="o2@e.com", password_hash="h")
    project = Project(name="P", project_type=ProjectType.OTHER, status=ProjectStatus.ACTIVE, owner=user)
    db_session.add_all([user, project])
    db_session.commit()

    service = SiteService(SiteRepository(db_session))
    geojson = {"type": "Polygon", "coordinates": [[[0,0], [1,0], [1,1], [0,1], [0,0]]]}
    site = service.create_site(SiteCreate(project_id=project.id, name="Site", geometry=geojson))

    analytics = SiteAnalytics(
        site_id=site.id, recorded_date=date.today(), carbon_tonnes=10,
        biodiversity_score=50.0, vegetation_index=0.5, tree_cover_percentage=50.0
    )
    db_session.add(analytics)
    db_session.commit()

    db_session.delete(project)
    db_session.commit()

    assert db_session.get(Site, site.id) is None
    assert db_session.get(SiteAnalytics, analytics.id) is None


# ─── 3. SPATIAL TESTS ─────────────────────────────────────────────────────────────

@pytest.fixture
def site_service(db_session: Session) -> SiteService:
    return SiteService(SiteRepository(db_session))


@pytest.fixture
def project_id(db_session: Session) -> uuid.UUID:
    user = User(name="O", email="ospatial@e.com", password_hash="h")
    project = Project(name="P", project_type=ProjectType.OTHER, status=ProjectStatus.ACTIVE, owner=user)
    db_session.add_all([user, project])
    db_session.commit()
    return project.id


def test_valid_polygon_geometry_srid(site_service: SiteService, project_id: uuid.UUID) -> None:
    """Test persistence and SRID 4326 correctly assigned."""
    geojson = {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]}
    site = site_service.create_site(SiteCreate(project_id=project_id, name="Eq", geometry=geojson))
    geom_shape = to_shape(site.geometry)

    assert geom_shape.geom_type == "Polygon"
    assert site.geometry.srid == 4326


def test_spatial_area_calculation(site_service: SiteService, project_id: uuid.UUID) -> None:
    """Test geodesic geographic-area calculation in hectares."""
    # 1 degree square at equator is approx 1,232,100 hectares
    geojson = {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]}
    site = site_service.create_site(SiteCreate(project_id=project_id, name="Area", geometry=geojson))

    assert site.area_hectares > 1_000_000
    assert site.area_hectares < 1_500_000


def test_spatial_centroid_calculation(site_service: SiteService, project_id: uuid.UUID) -> None:
    """Test centroid calculation."""
    geojson = {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]}
    site = site_service.create_site(SiteCreate(project_id=project_id, name="Centroid", geometry=geojson))
    centroid_shape = to_shape(site.centroid)

    assert centroid_shape.geom_type == "Point"
    assert centroid_shape.x == pytest.approx(0.5)
    assert centroid_shape.y == pytest.approx(0.5)


def test_gist_spatial_index(db_session: Session) -> None:
    """Test that the GiST spatial index was created on sites.geometry."""
    result = db_session.execute(text(
        "SELECT indexdef FROM pg_indexes WHERE tablename = 'sites' AND indexname = 'idx_sites_geometry';"
    )).scalar_one_or_none()

    assert result is not None
    assert "gist" in result.lower()
    assert "geometry" in result.lower()


# ─── 4. GEOJSON VALIDATION ────────────────────────────────────────────────────────

def test_missing_geometry(site_service: SiteService, project_id: uuid.UUID) -> None:
    """Test missing geometry."""
    with pytest.raises(SiteValidationError):
        site_service.create_site(SiteCreate(project_id=project_id, name="B1", geometry={"type": "Polygon"}))


def test_unsupported_geometry_type(site_service: SiteService, project_id: uuid.UUID) -> None:
    """Test unsupported geometry type."""
    with pytest.raises(SiteValidationError, match="Unsupported geometry type"):
        site_service.create_site(SiteCreate(project_id=project_id, name="B2", geometry={"type": "Point", "coordinates": [0,0]}))


def test_malformed_coordinates(site_service: SiteService, project_id: uuid.UUID) -> None:
    """Test malformed coordinates structure."""
    with pytest.raises(SiteValidationError, match="Malformed geometry|Invalid polygon"):
        site_service.create_site(SiteCreate(project_id=project_id, name="B3", geometry={"type": "Polygon", "coordinates": "invalid"}))


def test_insufficient_polygon_coordinates(site_service: SiteService, project_id: uuid.UUID) -> None:
    """Test polygon with too few points."""
    with pytest.raises(SiteValidationError, match="Malformed geometry|Invalid polygon"):
        # A ring must have at least 4 coordinates
        site_service.create_site(SiteCreate(project_id=project_id, name="B4", geometry={"type": "Polygon", "coordinates": [[[0,0], [1,0], [0,0]]]}))


def test_unclosed_polygon_ring(site_service: SiteService, project_id: uuid.UUID) -> None:
    """Test polygon ring not closed (last != first)."""
    with pytest.raises(SiteValidationError, match="Malformed geometry|Invalid polygon"):
        site_service.create_site(SiteCreate(project_id=project_id, name="B5", geometry={"type": "Polygon", "coordinates": [[[0,0], [1,0], [1,1], [0,1]]]}))


def test_self_intersecting_polygon(site_service: SiteService, project_id: uuid.UUID) -> None:
    """Test invalid self-intersecting polygon."""
    with pytest.raises(SiteValidationError, match="Invalid polygon"):
        # Bowtie polygon
        site_service.create_site(SiteCreate(project_id=project_id, name="B6", geometry={"type": "Polygon", "coordinates": [[[0,0], [1,1], [1,0], [0,1], [0,0]]]}))


# ─── 5. ANALYTICS ─────────────────────────────────────────────────────────────────

def test_analytics_range_constraints(site_service: SiteService, project_id: uuid.UUID, db_session: Session) -> None:
    """Test check constraints on Analytics."""
    geojson = {"type": "Polygon", "coordinates": [[[0,0], [1,0], [1,1], [0,1], [0,0]]]}
    site = site_service.create_site(SiteCreate(project_id=project_id, name="Site", geometry=geojson))

    analytics = SiteAnalytics(
        site_id=site.id, recorded_date=date.today(), carbon_tonnes=10,
        biodiversity_score=150.0,  # Invalid: > 100
        vegetation_index=0.5, tree_cover_percentage=50.0
    )
    db_session.add(analytics)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
