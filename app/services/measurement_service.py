import math
from dataclasses import dataclass

from pyproj import CRS
from shapely.geometry.base import BaseGeometry

from app.core.constants import MeasurementStatus
from app.core.exceptions import AppError
from app.services.crs_service import transform_geometry


@dataclass(frozen=True)
class Measurement:
    type: str | None
    value: float | None
    unit: str | None
    status: MeasurementStatus
    message: str | None = None


def measure_geometry(geometry: BaseGeometry | None, source: CRS, target: CRS | None) -> Measurement:
    if geometry is None or geometry.is_empty or not geometry.is_valid:
        return Measurement(None, None, None, MeasurementStatus.INVALID_GEOMETRY, "Geometry is null, empty, or invalid.")
    if geometry.geom_type in {"Point", "MultiPoint"}:
        return Measurement(None, None, None, MeasurementStatus.NOT_REQUIRED, "Point geometry has no area or length measurement.")
    if geometry.geom_type in {"Polygon", "MultiPolygon"}:
        kind, unit = "area", "m²"
    elif geometry.geom_type in {"LineString", "MultiLineString"}:
        kind, unit = "length", "m"
    else:
        return Measurement(None, None, None, MeasurementStatus.UNSUPPORTED, f"Measurement is unsupported for {geometry.geom_type}.")
    if target is None:
        return Measurement(kind, None, unit, MeasurementStatus.MEASUREMENT_FAILED, "No metric measurement CRS is available.")
    try:
        projected = transform_geometry(geometry, source, target) if source != target else geometry
        value = projected.area if kind == "area" else projected.length
        if not math.isfinite(value):
            raise ValueError("Non-finite measurement")
        return Measurement(kind, round(value, 3), unit, MeasurementStatus.SUPPORTED)
    except (AppError, ValueError, OverflowError) as exc:
        return Measurement(kind, None, unit, MeasurementStatus.MEASUREMENT_FAILED, str(exc))
