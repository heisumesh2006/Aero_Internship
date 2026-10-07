from io import BytesIO

import geopandas as gpd
from shapely.geometry import GeometryCollection, Point


def upload(client, name: str, content: bytes):
    return client.post("/api/files/", files={"file": (name, BytesIO(content))})


def test_health_and_openapi(client):
    assert client.get("/health").json() == {"status": "ok"}
    schema = client.get("/openapi.json").json()
    assert schema["info"]["title"] == "Geospatial File Measurement API"
    assert "/api/files/{file_id}/measurements/" in schema["paths"]


def test_kml_upload_and_measurements(client, kml_bytes):
    response = upload(client, "demo.kml", kml_bytes)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert data["feature_count"] == 3
    assert data["source_crs"] == "EPSG:4326"
    assert data["measurement_crs"] == "EPSG:32643"
    assert client.get(f"/api/files/{data['id']}/").json()["filename"] == "demo.kml"
    measurements = client.get(f"/api/files/{data['id']}/measurements/").json()
    by_type = {item["geometry_type"]: item for item in measurements["features"]}
    assert by_type["Point"]["measurement"]["status"] == "NOT_REQUIRED"
    assert by_type["LineString"]["measurement"]["value"] > 500
    assert by_type["Polygon"]["measurement"]["value"] > 10000
    assert by_type["Polygon"]["measurement"]["unit"] == "m²"
    assert by_type["Polygon"]["geometry"]["type"] == "Polygon"


def test_shapefile_zip_upload(client, shapefile_zip):
    response = upload(client, "parcel.zip", shapefile_zip)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["file_type"] == "SHAPEFILE"
    assert data["feature_count"] == 1
    item = client.get(f"/api/files/{data['id']}/measurements/").json()["features"][0]
    assert item["properties"]["name"] == "parcel"
    assert item["measurement"]["status"] == "SUPPORTED"


def test_missing_file(client):
    response = client.get("/api/files/00000000-0000-0000-0000-000000000000/")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "FILE_NOT_FOUND"


def test_paginated_file_list(client, kml_bytes):
    ids = [upload(client, f"demo-{index}.kml", kml_bytes).json()["id"] for index in range(2)]
    page = client.get("/api/files/?limit=1&offset=1").json()
    assert page["total"] == 2
    assert page["limit"] == 1
    assert page["offset"] == 1
    assert page["items"][0]["id"] == ids[0]
    assert client.get("/api/files/?limit=101").status_code == 422


def test_unsupported_and_null_features_do_not_stop_dataset(client, monkeypatch):
    import app.services.file_service as service

    frame = gpd.GeoDataFrame(
        {"name": ["collection", "missing", "point"]},
        geometry=[GeometryCollection([Point(77.6, 13)]), None, Point(77.6, 13)],
        crs="EPSG:4326",
    )
    monkeypatch.setattr(service, "read_dataset", lambda *_: frame)
    response = upload(client, "demo.kml", b"test")
    assert response.status_code == 201, response.text
    items = client.get(f"/api/files/{response.json()['id']}/measurements/").json()["features"]
    assert [item["measurement"]["status"] for item in items] == ["UNSUPPORTED", "INVALID_GEOMETRY", "NOT_REQUIRED"]
    assert items[1]["geometry"] is None
