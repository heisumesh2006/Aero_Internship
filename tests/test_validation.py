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


