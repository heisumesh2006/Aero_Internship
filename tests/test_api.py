from io import BytesIO

import geopandas as gpd
from shapely.geometry import GeometryCollection, Point


def upload(client, name: str, content: bytes):
    return client.post("/api/files/", files={"file": (name, BytesIO(content))})


