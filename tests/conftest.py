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


