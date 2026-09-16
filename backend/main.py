"""
Darukaa.Earth FastAPI application factory.

Architecture:
    HTTP request → Router → Service layer → Repository → SQLAlchemy → PostgreSQL+PostGIS

Separation of concerns:
    - api/routes/: HTTP handler thin layer (input validation, response shaping)
    - app/services/: Business logic (no HTTP concerns)
    - app/repositories/: Database queries (no business logic)
    - app/models/: SQLAlchemy ORM models
    - app/schemas/: Pydantic request/response models
    - app/core/: Configuration, security utilities
    - app/db/: Database connection and session management
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health
from app.core.config import get_settings

settings = get_settings()


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    application = FastAPI(
        title="Darukaa.Earth API",
        description="Geospatial environmental intelligence platform — carbon and biodiversity project management.",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # ─── CORS ────────────────────────────────────────────────────────────────
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ─── Routers ─────────────────────────────────────────────────────────────
    application.include_router(health.router, prefix="/api/v1")

    return application


app = create_application()
