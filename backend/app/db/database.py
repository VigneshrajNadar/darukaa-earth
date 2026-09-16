"""
Database connection and session management.

Uses synchronous SQLAlchemy (not async) for the initial scaffold.
Rationale: simpler to reason about during the foundation stage.
Async SQLAlchemy can be migrated to when needed (e.g., when async
route handlers are introduced and connection pool pressure warrants it).
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    # pool_pre_ping tests the connection before use — handles DB restarts gracefully
    pool_pre_ping=True,
    echo=settings.debug,  # Log SQL queries only in debug mode
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a SQLAlchemy session.

    Usage in route handlers:
        def my_route(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
