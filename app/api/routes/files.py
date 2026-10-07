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


@router.post(
    "/", status_code=201, response_model=FileResponse,
    summary="Upload and process a KML or zipped shapefile",
    description="Validates and stores an upload, extracts its features, selects a metric CRS, and calculates measurements synchronously.",
    responses={400: {"description": "Invalid geospatial file"}, 413: {"description": "Upload too large"}, 415: {"description": "Unsupported extension"}},
)
async def upload_file(request: Request, file: UploadFile = File(...), session: Session = Depends(get_session)) -> FileResponse:
    file_type = file_type_for(file.filename)
    settings = request.app.state.settings
    logger.info("Upload started: type=%s", file_type)
    path, _size = await save_upload(file, settings.upload_dir, settings.max_upload_bytes)
    record = UploadedFile(original_filename=PureWindowsPath(file.filename or "upload").name[:255], stored_filename=path.name, file_type=file_type, status=FileStatus.PROCESSING)
    session.add(record)
    session.commit()
    try:
        process_file(session, record, path)
    except AppError:
        raise
    except Exception as exc:
        raise AppError("PROCESSING_FAILED", "Could not process the uploaded file.", 500) from exc
    return FileResponse.from_record(record)


@router.get("/", response_model=FileListResponse, summary="List uploaded files")
def list_files(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
) -> FileListResponse:
    total = session.scalar(select(func.count()).select_from(UploadedFile)) or 0
    records = session.scalars(select(UploadedFile).order_by(UploadedFile.created_at.desc(), UploadedFile.id.desc()).limit(limit).offset(offset)).all()
    return FileListResponse(total=total, limit=limit, offset=offset, items=[FileResponse.from_record(record) for record in records])


@router.get("/{file_id}/", response_model=FileResponse, summary="Get uploaded file metadata", responses={404: {"description": "File not found"}})
def get_file(file_id: str, session: Session = Depends(get_session)) -> FileResponse:
    return FileResponse.from_record(_get_file(session, file_id))


@router.get("/{file_id}/measurements/", response_model=FileMeasurementsResponse, summary="Get feature geometries and measurements", responses={404: {"description": "File not found"}})
def get_measurements(file_id: str, session: Session = Depends(get_session)) -> FileMeasurementsResponse:
    record = _get_file(session, file_id)
    features = session.scalars(select(Feature).where(Feature.uploaded_file_id == file_id).order_by(Feature.feature_index)).all()
    return FileMeasurementsResponse(
        file_id=record.id,
        filename=record.original_filename,
        source_crs=record.source_crs,
        measurement_crs=record.measurement_crs,
        feature_count=record.feature_count,
        features=[FeatureResponse(
            feature_index=feature.feature_index,
            external_feature_id=feature.external_feature_id,
            geometry_type=feature.geometry_type,
            geometry=feature.geometry_geojson,
            properties=feature.properties_json,
            source_crs=feature.source_crs,
            measurement_crs=feature.measurement_crs,
            measurement=MeasurementResponse(
                type=feature.measurement_type,
                value=float(feature.measurement_value) if feature.measurement_value is not None else None,
                unit=feature.measurement_unit,
                status=feature.measurement_status,
                message=feature.measurement_message,
            ),
        ) for feature in features],
    )
