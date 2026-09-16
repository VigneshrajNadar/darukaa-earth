# Darukaa.Earth Data Strategy and Dataset Selection

This document outlines the data strategy for Darukaa.Earth, detailing the public real-world datasets used for geographical context, as well as the synthetic data generation policies for simulating ecological metrics.

## 1. Dataset Overview
Darukaa.Earth operates on a dual-data strategy:
1. **Public Geospatial Data**: Real-world boundary, forest, and land-cover data sourced from authoritative scientific platforms.
2. **Synthetic Demonstration Data**: Mocked time-series values for carbon and biodiversity indicators to demonstrate the analytical capabilities of the platform without falsely claiming real-world measurements.

## 2. Candidate Datasets Considered
During the research phase, we evaluated several authoritative datasets:
- **Global Forest Watch (GFW)**: Tree cover, loss, and gain. Extremely robust, massive scale.
- **GBIF (Global Biodiversity Information Facility)**: Point occurrences of species globally. Huge, API-accessible, but complex to map to broad hectare-level scores easily.
- **WDPA (World Database on Protected Areas)**: Global boundaries of protected areas. Highly authoritative, large size, strict redistribution limitations for commercial entities.
- **ESA WorldCover**: 10m global land cover (2020/2021). Massive Cloud Optimized GeoTIFFs (COGs).

## 3. Selected Datasets
To balance credibility, manageable size, and hackathon deployment feasibility, we have selected:
1. **Global Forest Watch (Tree Cover & Forest Change)**: Excellent for extracting generalized region statistics or visualizing deforestation via their API/MapBuilder.
2. **Curated Demonstration Geometries (Inspired by WDPA)**: We created a hand-curated GeoJSON containing a small number of simplified, representative polygons across India. **These are curated demonstration geometries inspired by Indian conservation regions; they are not authoritative protected-area boundaries.** We do NOT redistribute restricted raw WDPA datasets.
3. **GBIF API**: Used for fetching realistic species occurrence data near a site coordinate, proving integration capabilities.

## 4. Sources & 5. Licensing
- **WDPA (UNEP-WCMC & IUCN)**: Free for non-commercial use. Redistribution requires permission. For the hackathon, we will process and use a small, localized subset.
- **Global Forest Watch (UMD/Google/USGS/NASA)**: Creative Commons Attribution 4.0 International (CC-BY 4.0).
- **GBIF**: Mostly CC0, CC-BY, and CC-BY-NC. We will rely on live API calls rather than redistributing raw data.

## 6. Data Fields
- **Geographic Boundaries (WDPA)**: Polygon geometry, site name, marine/terrestrial classification, designated year.
- **Forest Metrics (GFW)**: Canopy cover %, area of loss (ha), area of gain (ha).
- **Biodiversity (GBIF)**: Scientific name, coordinate, event date, taxonomic kingdom/phylum.

## 7. Geographic Coverage & 8. Temporal Coverage
- **Coverage**: All chosen datasets possess global (Earth-wide) coverage.
- **Temporal**: GFW provides annual updates; ESA WorldCover is specific to 2020/2021; GBIF contains historical records up to the present day.

## 9. Preprocessing Strategy
- **Geometries**: WDPA shapefiles will be converted to GeoJSON using `ogr2ogr` or Python (`geopandas`). Geometries will be simplified to reduce polygon vertex counts before loading into PostGIS.
- **Coordinate Systems**: All spatial data will be reprojected to EPSG:4326 (WGS 84) to match our PostGIS database constraints.

## 10. Database Mapping
- **Sites (`sites` table)**: Will map to WDPA geometries. The `geometry` column will store the boundary polygon. `area_hectares` and `centroid` will be derived natively using PostGIS.
- **Site Analytics (`site_analytics` table)**: Will NOT store raw public datasets. It will store synthetic generated time-series data demonstrating the platform's features.

## 11. Synthetic-Data Policy
Synthetic data will be explicitly labeled as such in the application UI (e.g., "Demonstration Data").
- **Carbon Tonnes**: Simulated using seasonal sine-wave functions to demonstrate sequestration growth.
- **Biodiversity Scores**: Randomized baseline scores bounded between 0 and 100 to simulate ecological health over time.
- **Tree Cover Percentage**: Mocked metrics mimicking a gradual restoration project.

**Rule**: Synthetic values must NEVER be presented as empirical measurements from an actual ecological project.

## 12. Limitations
- **Redistribution**: We cannot legally bundle the entire WDPA database in our repository.
- **Data Size**: Raw ESA WorldCover or GFW tiles are terabytes in size, necessitating the use of APIs or downloading highly clipped region-of-interest subsets.

## 13. Attribution Requirements
The Darukaa.Earth platform must include a prominent "Data Sources & Acknowledgements" section containing:
- *"Protected Area boundaries sourced from UNEP-WCMC and IUCN (year), Protected Planet: The World Database on Protected Areas (WDPA)."*
- *"Tree cover and loss data provided by Global Forest Watch (Source: Hansen/UMD/Google/USGS/NASA)."*
- *"Biodiversity occurrence data sourced via GBIF.org."*
