from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.exceptions import AppError


def file_type_for(filename: str | None) -> str:
    if not filename:
        raise AppError("INVALID_FILENAME", "A filename is required.")
    suffix = Path(filename).suffix.lower()
    if suffix == ".kml":
        return "KML"
    if suffix == ".zip":
        return "SHAPEFILE"
    raise AppError("UNSUPPORTED_FILE_TYPE", "Only .kml and .zip shapefile uploads are supported.", 415)


