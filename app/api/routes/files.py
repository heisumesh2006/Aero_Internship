import logging
from pathlib import PureWindowsPath

from fastapi import APIRouter, Depends, File, Query, Request, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.constants import FileStatus
from app.core.exceptions import AppError
from app.db.session import get_session
from app.models.feature import Feature
from app.models.uploaded_file import UploadedFile
from app.schemas.file import FileListResponse, FileResponse
from app.schemas.measurement import FeatureResponse, FileMeasurementsResponse, MeasurementResponse
from app.services.file_service import process_file
from app.utils.file_validation import file_type_for, save_upload

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/files", tags=["Files"])


def _get_file(session: Session, file_id: str) -> UploadedFile:
    record = session.get(UploadedFile, file_id)
    if record is None:
        raise AppError("FILE_NOT_FOUND", "Uploaded file was not found.", 404)
    return record


