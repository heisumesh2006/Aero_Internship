import logging
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.constants import FileStatus, MeasurementStatus
from app.core.exceptions import AppError
from app.models.feature import Feature
from app.models.uploaded_file import UploadedFile
from app.services.crs_service import crs_label, determine_measurement_crs, normalize_crs
from app.services.geospatial_service import read_dataset
from app.services.measurement_service import Measurement, measure_geometry
from app.utils.geometry import geometry_geojson, json_safe

logger = logging.getLogger(__name__)


def process_file(session: Session, record: UploadedFile, path: Path) -> UploadedFile:
    logger.info("Processing started: id=%s type=%s", record.id, record.file_type)
    try:
        frame = read_dataset(path, record.file_type)
        source = normalize_crs(frame.crs)
        target = determine_measurement_crs(frame, source)
        record.source_crs = crs_label(source)
        record.measurement_crs = crs_label(target) if target else None
        logger.info("Dataset %s: features=%d source_crs=%s measurement_crs=%s", record.id, len(frame), record.source_crs, record.measurement_crs)

        for position, (external_id, row) in enumerate(frame.iterrows()):
            geometry = row.geometry
            if geometry is not None and not hasattr(geometry, "geom_type"):
                geometry = None
            try:
                serialized = geometry_geojson(geometry)
                measurement = measure_geometry(geometry, source, target)
            except (ValueError, TypeError, OverflowError) as exc:
                serialized = None
                measurement = Measurement(None, None, None, MeasurementStatus.INVALID_GEOMETRY, str(exc))
            properties = {str(key): json_safe(value) for key, value in row.items() if key != frame.geometry.name}
            session.add(Feature(
                uploaded_file_id=record.id,
                feature_index=position,
                external_feature_id=str(external_id),
                geometry_type=geometry.geom_type if geometry is not None else None,
                geometry_geojson=serialized,
                properties_json=properties,
                source_crs=record.source_crs,
                measurement_crs=record.measurement_crs,
                measurement_type=measurement.type,
                measurement_value=measurement.value,
                measurement_unit=measurement.unit,
                measurement_status=measurement.status,
                measurement_message=measurement.message,
            ))
        record.feature_count = len(frame)
        record.status = FileStatus.COMPLETED
        record.completed_at = datetime.now(timezone.utc)
        session.commit()
        logger.info("Processing completed: id=%s features=%d", record.id, record.feature_count)
        return record
    except Exception as exc:
        session.rollback()
        record.status = FileStatus.FAILED
        record.error_message = exc.message if isinstance(exc, AppError) else "Processing failed unexpectedly."
        record.completed_at = datetime.now(timezone.utc)
        session.add(record)
        session.commit()
        logger.exception("Processing failed: id=%s", record.id)
        raise
