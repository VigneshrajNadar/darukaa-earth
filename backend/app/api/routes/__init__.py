"""app/api/routes package."""

from fastapi import APIRouter

from app.api.routes import analytics, auth, dashboard, health, projects, sites

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(sites.router, prefix="/sites", tags=["sites"])
api_router.include_router(analytics.router, prefix="/sites", tags=["analytics"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
