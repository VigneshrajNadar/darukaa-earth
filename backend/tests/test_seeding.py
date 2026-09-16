import uuid

# Import the seed script methods directly to test logic without calling argparse
from scripts.seed_demo_data import (
    DEMO_MONTHS,
    DEMO_PROJECTS,
    DEMO_USER_EMAIL,
    clamp,
    generate_deterministic_noise,
    generate_synthetic_analytics,
    seed_data,
)
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.site import Site
from app.models.site_analytics import SiteAnalytics
from app.models.user import User


def test_deterministic_noise():
    """Test that stable site codes produce stable noise values."""
    noise1 = generate_deterministic_noise("IND-WG-001", 0, (10.0, 50.0))
    noise2 = generate_deterministic_noise("IND-WG-001", 0, (10.0, 50.0))
    noise3 = generate_deterministic_noise("IND-WG-002", 0, (10.0, 50.0))

    assert noise1 == noise2
    assert noise1 != noise3
    assert 10.0 <= noise1 <= 50.0


def test_clamp():
    """Test value clamping."""
    assert clamp(5.0, 0.0, 10.0) == 5.0
    assert clamp(15.0, 0.0, 10.0) == 10.0
    assert clamp(-5.0, 0.0, 10.0) == 0.0


def test_synthetic_analytics_bounds_and_determinism(db_session: Session):
    """Test analytics generation logic explicitly before full seed."""
    site_id = uuid.uuid4()

    # Normally FK constraints would fail if site doesn't exist, but we will mock a db add
    # just by instantiating models and checking them, or by actually inserting a dummy site.

    # Create a dummy user/project/site to satisfy FK constraints in test DB
    user = User(email="test_seed@test.com", password_hash="hash", name="T")
    db_session.add(user)
    db_session.commit()

    from app.models.enums import ProjectStatus, ProjectType

    proj = Project(
        name="P",
        owner_id=user.id,
        project_type=ProjectType.OTHER,
        status=ProjectStatus.ACTIVE,
    )
    db_session.add(proj)
    db_session.commit()

    # We must provide geometry to Site. We'll use ST_GeomFromText directly or via SiteService
    # But since we just want to test analytics logic, let's call the generator and rollback.
    # The generator uses `db.add()`. We can just query what was added to the session.
    site = Site(id=site_id, project_id=proj.id, name="S", area_hectares=1.0)
    # fake geometry for FK
    from geoalchemy2.functions import ST_GeomFromText

    site.geometry = ST_GeomFromText("POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))", 4326)
    site.centroid = ST_GeomFromText("POINT(0.5 0.5)", 4326)
    db_session.add(site)
    db_session.commit()

    generate_synthetic_analytics(db_session, site.id, "TEST-CODE", months=12)
    db_session.flush()  # flush to DB so we can query

    analytics = (
        db_session.query(SiteAnalytics).filter(SiteAnalytics.site_id == site.id).all()
    )
    assert len(analytics) == 12

    for a in analytics:
        assert a.carbon_tonnes >= 0
        assert 0 <= a.biodiversity_score <= 100
        assert 0 <= a.vegetation_index <= 1
        assert 0 <= a.tree_cover_percentage <= 100


def test_seed_idempotency_and_reset(monkeypatch, db_session: Session):
    """
    Test the actual seed_data function behavior.
    We must monkeypatch the DB creation in the script so it uses the test database.
    """

    # Monkeypatch the create_engine and sessionmaker inside seed_demo_data
    # so it uses our pytest db_session instead of spinning up a new session.
    class DummySessionLocal:
        def __enter__(self):
            return db_session

        def __exit__(self, exc_type, exc_val, exc_tb):
            pass

    monkeypatch.setattr(
        "scripts.seed_demo_data.sessionmaker", lambda **kw: DummySessionLocal
    )
    monkeypatch.setattr("scripts.seed_demo_data.create_engine", lambda url, **kw: None)
    monkeypatch.setenv("DEMO_USER_PASSWORD", "test-only-demo-password")

    # Mock the passlib CryptContext to avoid bcrypt version incompatibility during testing
    class DummyCryptContext:
        def __init__(self, **kwargs):
            pass

        def hash(self, secret):
            return "dummy_hash"

    monkeypatch.setattr("passlib.context.CryptContext", DummyCryptContext)

    # Initial seed
    seed_data(reset=False)

    users = db_session.query(User).filter(User.email == DEMO_USER_EMAIL).all()
    assert len(users) == 1

    initial_site_count = db_session.query(Site).count()
    initial_analytics_count = db_session.query(SiteAnalytics).count()

    assert db_session.query(Project).count() == len(DEMO_PROJECTS)
    assert initial_site_count == len(DEMO_PROJECTS) * 5
    assert initial_analytics_count == initial_site_count * DEMO_MONTHS

    # Run again without reset (should be idempotent)
    seed_data(reset=False)

    assert db_session.query(Site).count() == initial_site_count

    # Run with reset
    seed_data(reset=True)

    assert db_session.query(User).filter(User.email == DEMO_USER_EMAIL).count() == 1
    assert db_session.query(Site).count() == initial_site_count
