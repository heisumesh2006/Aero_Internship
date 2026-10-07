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


