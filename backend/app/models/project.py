"""
Project ORM model — scaffold.

Columns, relationships (to sites), and geospatial fields will be defined
in the projects feature stage. Only core identity fields are defined here.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Project(Base):
    """A carbon or biodiversity project managed on the platform."""

    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
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

    def __repr__(self) -> str:
        return f"<Project id={self.id} name={self.name!r}>"
