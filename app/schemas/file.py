from datetime import datetime

from pydantic import BaseModel

from app.models.uploaded_file import UploadedFile


class FileResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    feature_count: int
    source_crs: str | None
    measurement_crs: str | None
    status: str
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None

    @classmethod
    def from_record(cls, record: UploadedFile) -> "FileResponse":
        return cls(
            id=record.id,
            filename=record.original_filename,
            file_type=record.file_type,
            feature_count=record.feature_count,
            source_crs=record.source_crs,
            measurement_crs=record.measurement_crs,
            status=record.status,
            error_message=record.error_message,
            created_at=record.created_at,
            completed_at=record.completed_at,
        )


class FileListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[FileResponse]
