"""
Pytest configuration and fixtures.
"""

from collections.abc import Generator

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.db.base import Base

settings = get_settings()

# Use the test database URL if defined, never fallback to dev database.
TEST_DB_URL = getattr(settings, "test_database_url", None)
if not TEST_DB_URL or TEST_DB_URL == settings.database_url:
    raise RuntimeError(
        "TEST_DATABASE_URL is not configured or matches the development database. "
        "You must explicitly configure a separate test database to avoid data corruption."
    )

# Global test engine (do not pool connections across tests to avoid interference)
test_engine = create_engine(TEST_DB_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db() -> Generator[None, None, None]:
    """
    Session-wide fixture to set up the test database schema.
    Uses Alembic metadata to create tables, or Base.metadata.
    For this test suite, we rely on Base.metadata.create_all() for speed,
    but ensure PostGIS is enabled first.
    """
    # Note: test database MUST already exist and have postgis installed
    # (or superuser must be used). For safety, we just create tables.
    # In a real CI pipeline, `createdb darukaa_test` and `psql -c "CREATE EXTENSION postgis"`
    # would run before pytest.

    # We execute raw SQL to ensure PostGIS and enums if Base.metadata misses them,
    # but GeoAlchemy2 usually handles PostGIS types fine if the DB has the extension.
    try:
        with test_engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
    except Exception:
        pass # If we lack permissions, assume it's already there

    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    yield

    # We could drop_all here, but leaving it helps debugging if a test fails


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """
    Function-scoped fixture providing a clean database session wrapped in a transaction.
    It rolls back after each test to keep tests isolated.
    """
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()
