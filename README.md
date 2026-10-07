# Geospatial File Measurement API

A FastAPI backend that accepts KML and zipped ESRI Shapefiles, stores their features in SQLite, and returns line lengths and polygon areas in metric units. It is designed as a locally runnable SDE internship project with explicit CRS handling, secure archive processing, and automated tests.

## Features

- KML and zipped shapefile upload with feature geometry, attributes, and IDs
- CRS detection and automatic UTM selection for geographic or non-metric projected data
- Polygon/MultiPolygon area in m²; LineString/MultiLineString length in m
- Point/MultiPoint and unsupported geometry statuses
- Persistent file metadata and GeoJSON feature records in SQLite
- Size and format validation; secure ZIP extraction with path, count, expansion, and symlink checks
- OpenAPI/Swagger docs, isolated tests, Docker, and GitHub Actions CI

## Tech stack

FastAPI provides typed HTTP endpoints and OpenAPI; Pydantic v2 validates responses; Uvicorn serves the app. SQLAlchemy 2.x maps SQLite records. GeoPandas and Pyogrio read geospatial formats; Shapely handles geometries; PyProj supplies CRS definitions and transformations. `python-multipart` handles uploads. Pytest, pytest-cov, and FastAPI TestClient/httpx verify behavior.

## Architecture

```text
Client -> FastAPI routes -> upload validation -> KML / safe ZIP + shapefile reader
                                      -> GeoPandas -> CRS service -> measurement service
                                      -> SQLAlchemy / SQLite -> API response
```

`app/api` owns HTTP details, `app/schemas` response shapes, `app/models` persistence, `app/db` sessions, `app/services` processing and projection rules, and `app/utils` validation, archive safety, and JSON conversion. `tests` exercises both endpoints and focused spatial/security logic.

## File processing flow

1. Receive a multipart `file` upload and check its extension and 25 MB default limit.
2. Store it under a generated UUID filename; retain the client filename only as metadata.
3. Create a `PROCESSING` database record. For ZIP, inspect every member, reject unsafe entries, and extract to a disposable temporary directory.
4. Read the KML or one complete shapefile (`.shp`, `.shx`, `.dbf`) into a GeoDataFrame.
5. Read the source CRS. KML defaults to its standard WGS84 CRS if a driver omits CRS. A shapefile without a usable `.prj` is rejected rather than guessed.
6. Choose a metric measurement CRS, then measure each supported feature after transformation. The stored GeoJSON stays in source coordinates.
7. Store feature metadata and mark the file `COMPLETED`. A file-level error marks it `FAILED` with a safe message. Temporary extraction files are removed.

## CRS handling

EPSG:4326 coordinates are longitude and latitude in degrees. A degree is an angular unit, so planar area or length on those raw coordinates is not a square-meter or meter measurement. For geographic and non-metric projected inputs, the service transforms the dataset to WGS84, finds the center of its bounds, selects the corresponding UTM zone, then transforms each geometry into that UTM CRS for measurement. Northern zones use EPSG:32601–32660; southern zones use EPSG:32701–32760. Already projected CRSs with meter axes are used directly.

For a Bengaluru feature around 77.6°E, 13°N, this selects UTM zone 43N (`EPSG:32643`). Its source geometry remains in EPSG:4326 while length is reported in meters and area in m². A single UTM zone is pragmatic for local and regional datasets; global, dateline-crossing, polar, or many-zone datasets need a geodesic or tailored projection strategy. Dataset centers outside UTM latitude limits are rejected for non-metric input.

## Setup

Python **3.11+** is required. From the repository root:

**Windows PowerShell**

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
```

**Linux/macOS**

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[dev]'
```

If your `python3` is below 3.11, use an installed `python3.11` or newer to create the environment. No `.env` is needed. See `.env.example` for `APP_NAME`, `DATABASE_URL`, `UPLOAD_DIR`, `MAX_UPLOAD_SIZE_MB`, and `LOG_LEVEL`; these are ordinary environment variables.

