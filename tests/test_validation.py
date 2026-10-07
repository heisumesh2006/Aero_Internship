from io import BytesIO
from pathlib import Path
from zipfile import ZipFile, ZipInfo

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app
from app.models.uploaded_file import UploadedFile


def upload(client, name, content):
    return client.post("/api/files/", files={"file": (name, BytesIO(content))})


def make_zip(tmp_path: Path, names: dict[str, bytes]) -> bytes:
    path = tmp_path / "custom.zip"
    with ZipFile(path, "w") as archive:
        for name, data in names.items():
            archive.writestr(name, data)
    return path.read_bytes()


def test_extension_and_empty_upload(client):
    response = upload(client, "demo.json", b"{}")
    assert response.status_code == 415
    assert response.json()["error"]["code"] == "UNSUPPORTED_FILE_TYPE"
    response = upload(client, "demo.kml", b"")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "EMPTY_FILE"


def test_size_limit(tmp_path, kml_bytes):
    settings = Settings(database_url=f"sqlite:///{(tmp_path / 'test.db').as_posix()}", upload_dir=tmp_path / "uploads", max_upload_size_mb=0)
    with TestClient(create_app(settings)) as client:
        response = upload(client, "demo.kml", kml_bytes)
    assert response.status_code == 413
    assert not list((tmp_path / "uploads").iterdir())


@pytest.mark.parametrize("content,code", [
    (b"not a ZIP", "INVALID_SHAPEFILE_ARCHIVE"),
    (None, "INVALID_SHAPEFILE_ARCHIVE"),
])
def test_corrupt_or_missing_shapefile(client, tmp_path, content, code):
    content = content if content is not None else make_zip(tmp_path, {"notes.txt": b"hello"})
    response = upload(client, "demo.zip", content)
    assert response.status_code == 400
    assert response.json()["error"]["code"] == code


def test_missing_companions(client, tmp_path):
    response = upload(client, "demo.zip", make_zip(tmp_path, {"parcel.shp": b"content"}))
    assert response.status_code == 400
    assert "missing .shx" in response.json()["error"]["message"]


@pytest.mark.parametrize("name", ["../escape.shp", "/absolute.shp", "C:\\escape.shp"])
def test_zip_traversal_rejected(client, tmp_path, name):
    response = upload(client, "demo.zip", make_zip(tmp_path, {name: b"content"}))
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "UNSAFE_ARCHIVE"
    assert not (tmp_path / "escape.shp").exists()


