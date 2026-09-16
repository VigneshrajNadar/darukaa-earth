"""Compatibility entrypoint for local development and deployment.

The application lives in :mod:`app.main`; keeping this module means existing
``uvicorn main:app`` commands serve every versioned API route, not health only.
"""

from app.main import app

__all__ = ["app"]
