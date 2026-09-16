#!/usr/bin/env python3
"""
Seed script for generating Darukaa.Earth demonstration data.

This script safely generates reproducible, deterministic demonstration data focused on India.
It creates a demo user, projects, sites (from data/demo/sites.geojson), and synthetic analytics.

Usage:
  python scripts/seed_demo_data.py
  python scripts/seed_demo_data.py --reset  (Requires explicit flag to drop existing demo data)
"""

import argparse
import hashlib
import logging
import math
import os
import sys
from datetime import date, timedelta
from pathlib import Path

# Add the backend directory to the Python path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.models.enums import ProjectStatus, ProjectType
from app.models.project import Project
from app.models.site import Site
from app.models.site_analytics import SiteAnalytics
from app.models.user import User
from app.repositories.site_repository import SiteRepository
from app.repositories.user_repository import UserRepository
from app.schemas.site import SiteCreate
from app.services.site_service import SiteService

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

DEMO_USER_EMAIL = "demo@darukaa-earth.com"
DEMO_MONTHS = 30
DEMO_PROJECTS = [
    (
        "PROJ-FOREST-01",
        "Western Ghats Restoration",
        "forest_restoration",
        "active",
        (75.9, 11.4),
    ),
    (
        "PROJ-MANGROVE-01",
        "Konkan Mangrove Demonstration",
        "mangrove_conservation",
        "monitoring",
        (73.0, 18.1),
    ),
    (
        "PROJ-CENTRAL-01",
        "Central India Forest Recovery",
        "forest_restoration",
        "active",
        (80.3, 22.3),
    ),
    (
        "PROJ-COAST-01",
        "Coastal Biodiversity Demonstration",
        "biodiversity_conservation",
        "monitoring",
        (80.4, 13.0),
    ),
    (
        "PROJ-WATER-01",
        "Watershed Regeneration Demonstration",
        "other",
        "planning",
        (75.7, 19.9),
    ),
    (
        "PROJ-COMMUNITY-01",
        "Community Reforestation Demonstration",
        "afforestation",
        "active",
        (77.5, 28.3),
    ),
    (
        "PROJ-LANDSCAPE-01",
        "Landscape Restoration Demonstration",
        "forest_restoration",
        "active",
        (85.4, 20.3),
    ),
    ("PROJ-AGRO-01", "Agroforestry Demonstration", "other", "monitoring", (74.2, 15.4)),
    (
        "PROJ-URBAN-01",
        "Urban Green Corridor Demonstration",
        "biodiversity_conservation",
        "planning",
        (72.9, 19.2),
    ),
    (
        "PROJ-HABITAT-01",
        "Northeast Habitat Recovery Demonstration",
        "wetland_conservation",
        "active",
        (91.8, 26.2),
    ),
]


def generate_deterministic_noise(
    seed_str: str, index: int, bounds: tuple[float, float]
) -> float:
    """Generate deterministic pseudo-random float between bounds based on a string seed."""
    hash_input = f"{seed_str}-{index}".encode()
    hash_val = int(hashlib.md5(hash_input).hexdigest(), 16)
    # Map to 0.0 - 1.0
    normalized = (hash_val % 10000) / 10000.0
    return bounds[0] + (normalized * (bounds[1] - bounds[0]))


def clamp(val: float, min_val: float, max_val: float) -> float:
    """Clamp a value between a minimum and maximum."""
    return max(min_val, min(val, max_val))


def build_demo_features() -> list[dict]:
    """Return 50 deterministic, curated (non-authoritative) demonstration polygons."""
    features = []
    for project_index, (
        code,
        name,
        project_type,
        _status,
        (longitude, latitude),
    ) in enumerate(DEMO_PROJECTS):
        region = name.replace(" Demonstration", "")
        for site_index in range(5):
            offset_x = (site_index % 3) * 0.16 + (site_index // 3) * 0.06
            offset_y = (site_index // 3) * 0.16 + (site_index % 2) * 0.045
            width = 0.045 + (site_index % 3) * 0.012
            height = 0.04 + ((project_index + site_index) % 3) * 0.013
            x, y = longitude + offset_x, latitude + offset_y
            features.append(
                {
                    "type": "Feature",
                    "properties": {
                        "site_code": f"IND-{project_index + 1:02d}-{site_index + 1:02d}",
                        "name": f"{region} Demo Site {site_index + 1:02d}",
                        "project_code": code,
                        "project_type": project_type,
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [x, y],
                                [x + width, y],
                                [x + width, y + height],
                                [x, y + height],
                                [x, y],
                            ]
                        ],
                    },
                }
            )
    return features


def hash_demo_password(password: str) -> str:
    """Hash the deployment-provided password for the demonstration account."""
    from passlib.context import CryptContext

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.hash(password)


def generate_synthetic_analytics(
    db: Session, site_id, site_code: str, months: int = 24
) -> None:
    """
    Generate deterministic synthetic analytics for a given site.
    Values are NOT real ecological measurements.
    """
    end_date = date.today()

    profile = int(hashlib.md5(site_code.encode()).hexdigest(), 16) % 8
    # Deterministic base parameters per site
    base_carbon = generate_deterministic_noise(site_code, 0, (10.0, 50.0))
    carbon_trend = generate_deterministic_noise(site_code, 1, (0.5, 2.0))

    base_biodiversity = generate_deterministic_noise(site_code, 2, (50.0, 80.0))
    bio_trend = generate_deterministic_noise(site_code, 3, (0.2, 0.8))

    base_veg = generate_deterministic_noise(site_code, 4, (0.4, 0.8))

    base_tree = generate_deterministic_noise(site_code, 5, (30.0, 70.0))
    tree_trend = generate_deterministic_noise(site_code, 6, (0.1, 0.5))

    for m in range(months):
        # We go backwards from end_date
        current_date = end_date - timedelta(days=30 * (months - m - 1))
        t = m  # Month index for trend

        # 1. Carbon Tonnes: gradual upward trajectory + seasonal + noise
        c_seasonal = 5.0 * math.sin(2 * math.pi * (current_date.month / 12.0))
        c_noise = generate_deterministic_noise(site_code, m * 10 + 1, (-2.0, 2.0))
        profile_trend = [1.0, 0.08, 1.4, 0.18, 0.45, -0.45, 0.2, 0.15][profile]
        recent_lift = max(0, t - (months * 0.65)) * (0.9 if profile == 7 else 0)
        variance = 2.5 if profile == 6 else 1.0
        carbon = max(
            0.0,
            base_carbon
            + (carbon_trend * profile_trend * t)
            + c_seasonal
            + (c_noise * variance)
            + recent_lift,
        )

        # 2. Biodiversity Score (0-100)
        b_seasonal = 2.0 * math.sin(2 * math.pi * (current_date.month / 12.0))
        b_noise = generate_deterministic_noise(site_code, m * 10 + 2, (-1.5, 1.5))
        bio = clamp(
            base_biodiversity
            + (bio_trend * profile_trend * t)
            + b_seasonal
            + (b_noise * variance),
            0.0,
            100.0,
        )

        # 3. Vegetation Index (0-1)
        v_seasonal = 0.1 * math.sin(2 * math.pi * (current_date.month / 12.0))
        v_noise = generate_deterministic_noise(site_code, m * 10 + 3, (-0.05, 0.05))
        veg = clamp(
            base_veg
            + (v_seasonal * (1.8 if profile == 3 else 1))
            + (v_noise * variance),
            0.0,
            1.0,
        )

        # 4. Tree Cover Percentage (0-100)
        t_noise = generate_deterministic_noise(site_code, m * 10 + 4, (-0.5, 0.5))
        tree = clamp(
            base_tree + (tree_trend * profile_trend * t) + (t_noise * variance),
            0.0,
            100.0,
        )

        analytics = SiteAnalytics(
            site_id=site_id,
            recorded_date=current_date,
            carbon_tonnes=carbon,
            biodiversity_score=bio,
            vegetation_index=veg,
            tree_cover_percentage=tree,
        )
        db.add(analytics)


def seed_data(reset: bool = False):
    demo_user_password = os.getenv("DEMO_USER_PASSWORD")
    if not demo_user_password:
        raise RuntimeError(
            "DEMO_USER_PASSWORD must be set before seeding demonstration data."
        )

    settings = get_settings()
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    with SessionLocal() as db:
        user_repo = UserRepository(db)
        site_service = SiteService(SiteRepository(db))

        existing_user = user_repo.get_by_email(DEMO_USER_EMAIL)

        if reset:
            if existing_user:
                logger.info(
                    "Reset flag provided. Deleting existing demo data (cascade will remove projects, sites, analytics)..."
                )
                db.delete(existing_user)
                db.commit()
                existing_user = None
            else:
                logger.info(
                    "Reset flag provided, but no demo data found. Proceeding with seed."
                )
        else:
            if existing_user:
                existing_user.password_hash = hash_demo_password(demo_user_password)
                db.commit()
                user = existing_user

        if not existing_user:
            logger.info("Creating demo user...")
            user = User(
                name="Demo Admin",
                email=DEMO_USER_EMAIL,
                password_hash=hash_demo_password(demo_user_password),
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Curated demonstration geometries are intentionally generated locally;
        # they are not official or authoritative geographic boundaries.
        features = build_demo_features()
        logger.info("Loaded %s curated demonstration features.", len(features))

        projects_cache = {}
        for code, name, project_type, status, _center in DEMO_PROJECTS:
            project = (
                db.query(Project)
                .filter(Project.owner_id == user.id, Project.name == name)
                .one_or_none()
            )
            if project is None:
                project = Project(
                    name=name,
                    description="Synthetic demonstration portfolio for product review.",
                    project_type=ProjectType(project_type),
                    status=ProjectStatus(status),
                    owner_id=user.id,
                )
                db.add(project)
                db.commit()
                db.refresh(project)
            projects_cache[code] = project

        for feature in features:
            props = feature.get("properties", {})
            geom = feature.get("geometry", {})

            project_code = props.get("project_code")
            project_type = props.get("project_type")
            site_code = props.get("site_code")
            site_name = props.get("name")

            project = projects_cache[project_code]

            existing_site = (
                db.query(Site)
                .filter(Site.project_id == project.id, Site.name == site_name)
                .one_or_none()
            )
            if existing_site:
                if (
                    db.query(SiteAnalytics)
                    .filter(SiteAnalytics.site_id == existing_site.id)
                    .count()
                    == 0
                ):
                    generate_synthetic_analytics(
                        db, existing_site.id, site_code, months=DEMO_MONTHS
                    )
                    db.commit()
                continue

            # Create Site
            logger.info(f"Creating site: {site_name} ({site_code})")
            site_in = SiteCreate(project_id=project.id, name=site_name, geometry=geom)
            try:
                site = site_service.create_site(site_in)
                db.commit()
                db.refresh(site)

                # Generate synthetic analytics
                generate_synthetic_analytics(db, site.id, site_code, months=DEMO_MONTHS)
                db.commit()
            except Exception as e:
                db.rollback()
                logger.error(f"Failed to create site {site_code}: {e}")

        logger.info("Demo data seeding completed successfully.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed demonstration data.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete existing demonstration data before seeding",
    )
    args = parser.parse_args()

    seed_data(reset=args.reset)
