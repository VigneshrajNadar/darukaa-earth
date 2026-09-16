"""
Site service layer.
"""

from collections.abc import Sequence

from geoalchemy2 import Geography
from geoalchemy2.functions import ST_Area, ST_Centroid, ST_GeomFromText
from sqlalchemy import cast

from app.models.site import Site
from app.repositories.site_repository import SiteRepository
from app.schemas.site import SiteCreate


class SiteValidationError(ValueError):
    """Application-level error for invalid site data (e.g., GeoJSON validation)."""
    pass


class SiteService:
    """Service for managing sites."""

    def __init__(self, repository: SiteRepository):
        self.repository = repository

    def _validate_and_parse_geojson(self, geojson: dict) -> str:
        """
        Validates GeoJSON dict and returns WKT.
        Raises SiteValidationError on invalid structure or geometry.
        """
        try:
            from shapely.geometry import shape
        except ImportError as e:
            raise RuntimeError("Shapely is required for spatial validation.") from e

        if not isinstance(geojson, dict):
            raise SiteValidationError("Geometry must be a dictionary.")

        geom_type = geojson.get("type")
        if geom_type != "Polygon":
            raise SiteValidationError(f"Unsupported geometry type: {geom_type}. Only Polygon is allowed.")

        # GeoJSON strictly requires rings to be closed
        coords = geojson.get("coordinates", [])
        for ring in coords:
            if len(ring) < 4:
                raise SiteValidationError("Invalid polygon: rings must have at least 4 coordinates.")
            if ring[0] != ring[-1]:
                raise SiteValidationError("Invalid polygon: rings must be closed (first and last coordinate must match).")

        try:
            geom = shape(geojson)
        except Exception as e:
            raise SiteValidationError(f"Malformed geometry coordinates: {e}") from e

        if not geom.is_valid:
            # Shapely validates ring closure, self-intersection, etc.
            raise SiteValidationError("Invalid polygon geometry (e.g., self-intersecting or invalid ring closure).")

        if geom.is_empty:
            raise SiteValidationError("Geometry cannot be empty.")

        return geom.wkt

    def create_site(self, site_in: SiteCreate) -> Site:
        """
        Create a new site.
        Validates GeoJSON, computes area and centroid via database.
        """
        wkt = self._validate_and_parse_geojson(site_in.geometry)

        site = Site(
            project_id=site_in.project_id,
            name=site_in.name,
            # Assigning PostGIS functions which will be evaluated on INSERT
            geometry=ST_GeomFromText(wkt, 4326),
            # ST_Area on geography type gives square meters. Divide by 10000 for hectares.
            area_hectares=ST_Area(cast(ST_GeomFromText(wkt, 4326), Geography)) / 10000.0,
            centroid=ST_Centroid(ST_GeomFromText(wkt, 4326)),
        )
        return self.repository.create(site)

    def get_site(self, site_id) -> Site | None:
        """Get a site by ID."""
        return self.repository.get_by_id(site_id)

    def list_sites_by_project(self, project_id) -> Sequence[Site]:
        """List all sites for a project."""
        return self.repository.list_by_project(project_id)
