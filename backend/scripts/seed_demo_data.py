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
import json
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


def generate_synthetic_analytics(
    db: Session, site_id, site_code: str, months: int = 24
) -> None:
    """
    Generate deterministic synthetic analytics for a given site.
    Values are NOT real ecological measurements.
    """
    end_date = date.today()

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
        carbon = max(0.0, base_carbon + (carbon_trend * t) + c_seasonal + c_noise)

        # 2. Biodiversity Score (0-100)
        b_seasonal = 2.0 * math.sin(2 * math.pi * (current_date.month / 12.0))
        b_noise = generate_deterministic_noise(site_code, m * 10 + 2, (-1.5, 1.5))
        bio = clamp(
            base_biodiversity + (bio_trend * t) + b_seasonal + b_noise, 0.0, 100.0
        )

        # 3. Vegetation Index (0-1)
        v_seasonal = 0.1 * math.sin(2 * math.pi * (current_date.month / 12.0))
        v_noise = generate_deterministic_noise(site_code, m * 10 + 3, (-0.05, 0.05))
        veg = clamp(base_veg + v_seasonal + v_noise, 0.0, 1.0)

        # 4. Tree Cover Percentage (0-100)
        t_noise = generate_deterministic_noise(site_code, m * 10 + 4, (-0.5, 0.5))
        tree = clamp(base_tree + (tree_trend * t) + t_noise, 0.0, 100.0)

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
                logger.info(
                    "Demo user already exists. Seed is idempotent and will not duplicate data. Run with --reset to rebuild."
                )
                return

        # 1. Create Demo User
        logger.info("Creating demo user...")
        try:
            from passlib.context import CryptContext

            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            hashed_pw = pwd_context.hash(demo_user_password)
        except ValueError:
            # Workaround for passlib + bcrypt >= 4.0 bug
            hashed_pw = "$2b$12$eDjCSc0zzs3FwlldsAGXx.ohU9uQXtE3cjL5.CuY6Qy1H.3twWSvW"

        user = User(name="Demo Admin", email=DEMO_USER_EMAIL, password_hash=hashed_pw)
        db.add(user)
        db.commit()
        db.refresh(user)

        # 2. Parse GeoJSON and build projects/sites
        geojson_path = (
            Path(__file__).resolve().parents[1] / "data" / "demo" / "sites.geojson"
        )
        if not geojson_path.exists():
            logger.error(f"GeoJSON file not found at {geojson_path}")
            sys.exit(1)

        with open(geojson_path, encoding="utf-8") as f:
            fc = json.load(f)

        logger.info(f"Loaded {len(fc.get('features', []))} curated demo features.")

        projects_cache = {}

        for feature in fc.get("features", []):
            props = feature.get("properties", {})
            geom = feature.get("geometry", {})

            project_code = props.get("project_code")
            project_type = props.get("project_type")
            site_code = props.get("site_code")
            site_name = props.get("name")

            # Create Project if not exists
            if project_code not in projects_cache:
                logger.info(f"Creating project: {project_code}")
                # Derive realistic names from the code
                project_name = project_code.replace("-", " ").title()

                ptype = ProjectType(project_type) if project_type else ProjectType.OTHER

                project = Project(
                    name=project_name,
                    project_type=ptype,
                    status=ProjectStatus.ACTIVE,
                    owner_id=user.id,
                )
                db.add(project)
                db.commit()
                db.refresh(project)
                projects_cache[project_code] = project

            project = projects_cache[project_code]

            # Create Site
            logger.info(f"Creating site: {site_name} ({site_code})")
            site_in = SiteCreate(project_id=project.id, name=site_name, geometry=geom)
            try:
                site = site_service.create_site(site_in)
                db.commit()
                db.refresh(site)

                # Generate synthetic analytics
                generate_synthetic_analytics(db, site.id, site_code, months=24)
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
