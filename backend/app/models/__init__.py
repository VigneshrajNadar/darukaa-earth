"""app/models package — imports all models so Alembic autodiscovery works."""

from app.models.project import Project
from app.models.user import User

__all__ = ["User", "Project"]
