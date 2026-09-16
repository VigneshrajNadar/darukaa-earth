"""Pydantic schema for the /health endpoint response."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Response body for GET /api/v1/health."""

    status: str
    service: str
