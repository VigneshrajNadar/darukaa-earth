"""
SiteAnalytics ORM model.
"""

import uuid
from datetime import UTC, date, datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.site import Site

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SiteAnalytics(Base):
    """Environmental metrics recorded for a site on a specific date."""

    __tablename__ = "site_analytics"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    site_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sites.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    recorded_date: Mapped[date] = mapped_column(Date, nullable=False)

    carbon_tonnes: Mapped[float] = mapped_column(Numeric(12, 4), nullable=False)
    biodiversity_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    vegetation_index: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    tree_cover_percentage: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
    )

    # Relationships
    site: Mapped["Site"] = relationship(
        "Site",
        back_populates="analytics",
    )

    __table_args__ = (
        CheckConstraint("carbon_tonnes >= 0", name="chk_carbon_tonnes_positive"),
        CheckConstraint(
            "biodiversity_score >= 0 AND biodiversity_score <= 100",
            name="chk_biodiversity_score_range",
        ),
        CheckConstraint(
            "vegetation_index >= 0 AND vegetation_index <= 1",
            name="chk_vegetation_index_range",
        ),
        CheckConstraint(
            "tree_cover_percentage >= 0 AND tree_cover_percentage <= 100",
            name="chk_tree_cover_percentage_range",
        ),
    )

    def __repr__(self) -> str:
        return f"<SiteAnalytics id={self.id} site={self.site_id}>"
