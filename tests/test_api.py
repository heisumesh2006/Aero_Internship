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


