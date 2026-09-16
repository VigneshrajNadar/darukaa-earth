"""Initial schema

Revision ID: 001
Revises: None
Create Date: 2026-09-16 12:00:00.000000

"""

from collections.abc import Sequence

import geoalchemy2
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Enable PostGIS extension
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

    # 2. Create ENUMs
    project_type_enum = postgresql.ENUM(
        "FOREST_RESTORATION",
        "AFFORESTATION",
        "MANGROVE_CONSERVATION",
        "WETLAND_CONSERVATION",
        "BIODIVERSITY_CONSERVATION",
        "OTHER",
        name="project_type_enum",
    )
    project_type_enum.create(op.get_bind())

    project_status_enum = postgresql.ENUM(
        "PLANNING",
        "ACTIVE",
        "MONITORING",
        "COMPLETED",
        "ARCHIVED",
        name="project_status_enum",
    )
    project_status_enum.create(op.get_bind())

    # 3. Create tables
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    # Functional index on email
    op.execute("CREATE UNIQUE INDEX ix_users_email_lower ON users (lower(email));")

    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "project_type",
            postgresql.ENUM(name="project_type_enum", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "status",
            postgresql.ENUM(name="project_status_enum", create_type=False),
            nullable=False,
        ),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_projects_owner_id"), "projects", ["owner_id"], unique=False
    )

    op.create_table(
        "sites",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column(
            "geometry",
            geoalchemy2.types.Geometry(
                geometry_type="POLYGON",
                srid=4326,
                from_text="ST_GeomFromEWKT",
                name="geometry",
                nullable=False,
                spatial_index=False,
            ),
        ),
        sa.Column("area_hectares", sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column(
            "centroid",
            geoalchemy2.types.Geometry(
                geometry_type="POINT",
                srid=4326,
                from_text="ST_GeomFromEWKT",
                name="geometry",
                nullable=True,
                spatial_index=False,
            ),
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sites_project_id"), "sites", ["project_id"], unique=False)
    op.execute("CREATE INDEX idx_sites_geometry ON sites USING GIST (geometry);")

    op.create_table(
        "site_analytics",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("site_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("recorded_date", sa.Date(), nullable=False),
        sa.Column("carbon_tonnes", sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column(
            "biodiversity_score", sa.Numeric(precision=5, scale=2), nullable=False
        ),
        sa.Column("vegetation_index", sa.Numeric(precision=5, scale=4), nullable=False),
        sa.Column(
            "tree_cover_percentage", sa.Numeric(precision=5, scale=2), nullable=False
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "biodiversity_score >= 0 AND biodiversity_score <= 100",
            name="chk_biodiversity_score_range",
        ),
        sa.CheckConstraint("carbon_tonnes >= 0", name="chk_carbon_tonnes_positive"),
        sa.CheckConstraint(
            "tree_cover_percentage >= 0 AND tree_cover_percentage <= 100",
            name="chk_tree_cover_percentage_range",
        ),
        sa.CheckConstraint(
            "vegetation_index >= 0 AND vegetation_index <= 1",
            name="chk_vegetation_index_range",
        ),
        sa.ForeignKeyConstraint(["site_id"], ["sites.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_site_analytics_site_id"), "site_analytics", ["site_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_site_analytics_site_id"), table_name="site_analytics")
    op.drop_table("site_analytics")
    op.execute("DROP INDEX idx_sites_geometry;")
    op.drop_index(op.f("ix_sites_project_id"), table_name="sites")
    op.drop_table("sites")
    op.drop_index(op.f("ix_projects_owner_id"), table_name="projects")
    op.drop_table("projects")
    op.execute("DROP INDEX ix_users_email_lower;")
    op.drop_table("users")

    project_status_enum = postgresql.ENUM(
        "PLANNING",
        "ACTIVE",
        "MONITORING",
        "COMPLETED",
        "ARCHIVED",
        name="project_status_enum",
    )
    project_status_enum.drop(op.get_bind())

    project_type_enum = postgresql.ENUM(
        "FOREST_RESTORATION",
        "AFFORESTATION",
        "MANGROVE_CONSERVATION",
        "WETLAND_CONSERVATION",
        "BIODIVERSITY_CONSERVATION",
        "OTHER",
        name="project_type_enum",
    )
    project_type_enum.drop(op.get_bind())

    op.execute("DROP EXTENSION IF EXISTS postgis;")
