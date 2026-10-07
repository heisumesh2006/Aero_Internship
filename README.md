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

