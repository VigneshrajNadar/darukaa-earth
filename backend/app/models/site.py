"""
Site ORM model.
"""

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.site_analytics import SiteAnalytics

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Site(Base):
    """A specific geographic site within a project."""

    __tablename__ = "sites"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # PostGIS Polygon geometry in WGS 84 (SRID 4326)
    # spatial_index=False because we define it explicitly below in __table_args__
    geometry: Mapped[str] = mapped_column(
        Geometry("POLYGON", srid=4326, spatial_index=False),
        nullable=False,
    )

    # Computed area in hectares (stored to avoid re-computing on every read)
    area_hectares: Mapped[float] = mapped_column(
        Numeric(12, 4),
        nullable=False,
    )

    # Computed centroid of the site
    centroid: Mapped[str | None] = mapped_column(
        Geometry("POINT", srid=4326, spatial_index=False),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    project: Mapped["Project"] = relationship(
        "Project",
        back_populates="sites",
    )
    analytics: Mapped[list["SiteAnalytics"]] = relationship(
        "SiteAnalytics",
        back_populates="site",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        # Explicit GiST spatial index on geometry
        Index("idx_sites_geometry", "geometry", postgresql_using="gist"),
    )

    def __repr__(self) -> str:
        return f"<Site id={self.id} name={self.name!r}>"
