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

