# Demonstration dataset

Darukaa.Earth seeds a deterministic product-demonstration dataset containing ten
environmental project portfolios, fifty curated site geometries, and thirty monthly
synthetic analytics records per seeded site.

The geometries are illustrative EPSG:4326 polygons inspired by broad Indian regions.
They are not official, verified, or authoritative protected-area boundaries. The time
series and all environmental values are synthetic demonstration data, not measured
ecological observations.

Run `python scripts/seed_demo_data.py` with the intended database environment set.
The operation is idempotent: it adds only missing named demonstration portfolios and
sites, and never removes user-created data. `--reset` deletes only the demonstration
user and the data owned by it, so it must not be used where that account contains
user-created work.
