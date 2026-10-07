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


