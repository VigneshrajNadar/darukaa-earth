"""Health check route — the only implemented API endpoint in this scaffold."""

from fastapi import APIRouter

from app.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Returns the service status. Used by load balancers and monitoring systems.",
)
def health_check() -> HealthResponse:
    """Return service health status."""
    return HealthResponse(status="ok", service="darukaa-earth-api")
