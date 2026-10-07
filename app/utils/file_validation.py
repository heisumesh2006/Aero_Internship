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


async def save_upload(file: UploadFile, upload_dir: Path, max_bytes: int) -> tuple[Path, int]:
    suffix = Path(file.filename or "").suffix.lower()
    upload_dir.mkdir(parents=True, exist_ok=True)
    destination = upload_dir / f"{uuid4()}{suffix}"
    size = 0
    try:
        with destination.open("wb") as output:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > max_bytes:
                    raise AppError("FILE_TOO_LARGE", "Upload exceeds the configured size limit.", 413)
                output.write(chunk)
        if size == 0:
            raise AppError("EMPTY_FILE", "Uploaded file is empty.")
        return destination, size
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    finally:
        await file.close()
