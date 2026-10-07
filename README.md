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

## Run application

```bash
uvicorn app.main:app --reload
```

Tables and `uploads/` are initialized at startup. Open [Swagger UI](http://127.0.0.1:8000/docs) or [ReDoc](http://127.0.0.1:8000/redoc).

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Availability check |
| POST | `/api/files/` | Multipart `file` upload; processes synchronously |
| GET | `/api/files/?limit=20&offset=0` | Paginated upload metadata; limit 1–100 |
| GET | `/api/files/{id}/` | File metadata and status |
| GET | `/api/files/{id}/measurements/` | Ordered features, GeoJSON, attributes, and measurements |

Generate demonstration uploads with `python scripts/generate_sample_data.py`, then:

```bash
curl -F "file=@sample_data/bengaluru_demo.kml" http://127.0.0.1:8000/api/files/
curl http://127.0.0.1:8000/api/files/REPLACE_UUID/measurements/
```

PowerShell:

```powershell
curl.exe -F "file=@sample_data/bengaluru_demo.kml" http://127.0.0.1:8000/api/files/
Invoke-RestMethod http://127.0.0.1:8000/api/files/REPLACE_UUID/measurements/
```

### Example responses

An upload returns HTTP 201:

```json
{"id":"7bf31d2a-4641-4da7-94df-3c886f0fcd19","filename":"bengaluru_demo.kml","file_type":"KML","feature_count":3,"source_crs":"EPSG:4326","measurement_crs":"EPSG:32643","status":"COMPLETED","error_message":null,"created_at":"2026-10-07T10:00:00Z","completed_at":"2026-10-07T10:00:01Z"}
```

`GET /api/files/{id}/measurements/` returns `file_id`, `filename`, both CRSs, `feature_count`, and a `features` array. Each feature contains `feature_index`, `external_feature_id`, `geometry_type`, source-coordinate GeoJSON `geometry`, `properties`, both CRSs, and a measurement object such as `{"type":"area","value":12034.567,"unit":"m²","status":"SUPPORTED","message":null}`. Point features return `NOT_REQUIRED`; null/empty/invalid geometries return `INVALID_GEOMETRY`; GeometryCollection returns `UNSUPPORTED`. Errors use `{"error":{"code":"...","message":"..."}}` with 400, 404, 413, or 415 as appropriate.

## Running tests

```bash
pytest
pytest --cov=app --cov-report=term-missing
```

Tests generate shapefiles in temporary directories and use separate SQLite databases and upload folders.

## Docker

```bash
docker compose up --build
```

The image uses Python 3.12 and runs as a non-root user. A named volume preserves SQLite and uploads at `/data`; the API is on port 8000. The local venv, DB, uploads, caches, and secrets are excluded from the build context.

## Design decisions and alternatives

- **FastAPI + Pydantic** keep request/response contracts clear and document them automatically. Django REST Framework would be viable but adds framework weight for this small API.
- **SQLite + SQLAlchemy** make local setup simple while demonstrating relational modeling and session boundaries. PostGIS would be appropriate for spatial queries at scale; here GeoJSON JSON storage is sufficient because uploads are measured once and fetched by ID.
- **GeoPandas, Shapely, PyProj** provide mature file reading, geometry operations, and coordinate transforms. A hand-rolled parser or degree-based arithmetic would be error-prone.
- **Synchronous processing** keeps assignment behavior deterministic. For large files, a Celery/RQ worker, queued job status, and object storage such as S3 would avoid long HTTP requests.
- **UTM** is a straightforward local/regional metric projection. Equal-area projections or `pyproj.Geod` are better choices for certain broad-area measurements.
- **Validated ZIP extraction** protects against traversal, symlink entries, many-entry archives, and excessive expansion before reading shapefile components.

## Security considerations

Only `.kml` and `.zip` extensions are accepted; upload bytes are capped. Client filenames never determine storage paths. ZIP entries are checked for absolute or parent paths, Windows path forms and reserved device names, symlinks, duplicates, entry count, expanded size, and extreme compression ratio. Exactly one shapefile and its mandatory companion files are required. Extracted data lives in a unique temporary directory. Malformed spatial input receives a structured error without a traceback in the API response.

## Limitations

One shapefile dataset is accepted per ZIP. Processing is synchronous and SQLite targets local or small deployments. A single dataset-center UTM zone can distort very large or cross-zone datasets; dateline and polar datasets need a different strategy. Uploaded originals remain on local disk for audit/reprocessing and there is no retention policy, authentication, or cloud object storage.

