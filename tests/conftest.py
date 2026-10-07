from pathlib import Path
from zipfile import ZipFile

import geopandas as gpd
import pytest
from fastapi.testclient import TestClient
from shapely.geometry import Polygon

from app.core.config import Settings
from app.main import create_app
from scripts.generate_sample_data import KML


@pytest.fixture
def client(tmp_path: Path):
    settings = Settings(database_url=f"sqlite:///{(tmp_path / 'test.db').as_posix()}", upload_dir=tmp_path / "uploads")
    with TestClient(create_app(settings)) as test_client:
        yield test_client


@pytest.fixture
def kml_bytes() -> bytes:
    return KML.encode("utf-8")


@pytest.fixture
def shapefile_zip(tmp_path: Path) -> bytes:
    polygon = Polygon([(77.59, 12.97), (77.60, 12.97), (77.60, 12.98), (77.59, 12.98)])
    frame = gpd.GeoDataFrame({"name": ["parcel"]}, geometry=[polygon], crs="EPSG:4326")
    directory = tmp_path / "source"
    directory.mkdir()
    shp = directory / "parcel.shp"
    frame.to_file(shp, engine="pyogrio")
    archive_path = tmp_path / "data.zip"
    with ZipFile(archive_path, "w") as archive:
        for companion in directory.iterdir():
            archive.write(companion, companion.name)
    return archive_path.read_bytes()
