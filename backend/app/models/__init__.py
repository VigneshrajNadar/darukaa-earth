"""
Import all models here so that Alembic can easily discover them
via `Base.metadata`.
"""

from app.models.project import Project  # noqa: F401
from app.models.site import Site  # noqa: F401
from app.models.site_analytics import SiteAnalytics  # noqa: F401
from app.models.user import User  # noqa: F401
