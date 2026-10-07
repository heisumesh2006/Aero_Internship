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


def test_backslash_archive_path_rejected(tmp_path):
    from types import SimpleNamespace
    from app.core.exceptions import AppError
    from app.utils.safe_zip import _safe_destination

    member = SimpleNamespace(filename="folder\\escape.shp", external_attr=0)
    with pytest.raises(AppError, match="unsafe path"):
        _safe_destination(tmp_path, member)


@pytest.mark.parametrize("name", ["CON.shp", "folder/NUL.txt", "aux .dbf"])
def test_windows_device_names_rejected(client, tmp_path, name):
    response = upload(client, "demo.zip", make_zip(tmp_path, {name: b"content"}))
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "UNSAFE_ARCHIVE"


def test_archive_member_limit(client, tmp_path):
    response = upload(client, "demo.zip", make_zip(tmp_path, {f"entry-{i}.txt": b"x" for i in range(201)}))
    assert response.status_code == 400
    assert "too many entries" in response.json()["error"]["message"]


def test_symlink_member_rejected(client, tmp_path):
    path = tmp_path / "symlink.zip"
    info = ZipInfo("parcel.shp")
    info.create_system = 3
    info.external_attr = 0o120777 << 16
    with ZipFile(path, "w") as archive:
        archive.writestr(info, "target")
    response = upload(client, "demo.zip", path.read_bytes())
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "UNSAFE_ARCHIVE"


def test_multiple_shapefiles_rejected(client, tmp_path):
    response = upload(client, "demo.zip", make_zip(tmp_path, {
        "a.shp": b"", "a.shx": b"", "a.dbf": b"",
        "b.shp": b"", "b.shx": b"", "b.dbf": b"",
    }))
    assert response.status_code == 400
    assert "exactly one" in response.json()["error"]["message"]


def test_failed_processing_is_persisted(client):
    response = upload(client, "bad.kml", b"not xml")
    assert response.status_code == 400
    with client.app.state.session_factory() as session:
        records = session.query(UploadedFile).all()
        assert len(records) == 1
        assert records[0].status == "FAILED"
        assert records[0].error_message


