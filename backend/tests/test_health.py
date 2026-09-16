"""
Tests for GET /api/v1/health.

This is the only implemented API endpoint in the scaffold stage.
Uses FastAPI's TestClient (synchronous) via httpx.
"""

import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client() -> TestClient:
    """Return a FastAPI test client."""
    return TestClient(app)


class TestHealthEndpoint:
    """Tests for the health check endpoint."""

    def test_health_returns_200(self, client: TestClient) -> None:
        """Health endpoint should return HTTP 200 OK."""
        response = client.get("/api/v1/health")
        assert response.status_code == 200

    def test_health_returns_correct_body(self, client: TestClient) -> None:
        """Health endpoint should return the exact expected JSON body."""
        response = client.get("/api/v1/health")
        body = response.json()
        assert body == {"status": "ok", "service": "darukaa-earth-api"}

    def test_health_content_type_is_json(self, client: TestClient) -> None:
        """Health endpoint should return Content-Type: application/json."""
        response = client.get("/api/v1/health")
        assert "application/json" in response.headers["content-type"]
