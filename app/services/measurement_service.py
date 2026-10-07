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


