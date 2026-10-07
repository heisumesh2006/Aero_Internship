import math

import geopandas as gpd
from pyproj import CRS, Transformer
from pyproj.exceptions import CRSError
from shapely import transform
from shapely.geometry.base import BaseGeometry

from app.core.exceptions import AppError


def normalize_crs(value: object) -> CRS:
    try:
        return CRS.from_user_input(value)
    except (CRSError, ValueError, TypeError) as exc:
        raise AppError("INVALID_CRS", "Dataset CRS is missing or invalid.") from exc


def crs_label(crs: CRS) -> str:
    return crs.to_authority() and ":".join(crs.to_authority()) or crs.to_string()


def is_geographic_crs(crs: CRS) -> bool:
    return crs.is_geographic


def determine_utm_crs(longitude: float, latitude: float) -> CRS:
    if not (math.isfinite(longitude) and math.isfinite(latitude)):
        raise AppError("INVALID_CRS", "Dataset center has invalid coordinates.")
    if not -80 <= latitude <= 84:
        raise AppError("UNSUPPORTED_CRS_REGION", "UTM measurement requires a dataset center between 80°S and 84°N.")
    zone = max(1, min(60, math.floor((longitude + 180) / 6) + 1))
    return CRS.from_epsg((32600 if latitude >= 0 else 32700) + zone)


def _uses_meters(crs: CRS) -> bool:
    return crs.is_projected and bool(crs.axis_info) and all(
        math.isclose(axis.unit_conversion_factor, 1.0, rel_tol=1e-9)
        for axis in crs.axis_info[:2]
    )


def determine_measurement_crs(frame: gpd.GeoDataFrame, source_crs: CRS) -> CRS | None:
    if _uses_meters(source_crs):
        return source_crs
    nonempty = frame.geometry[frame.geometry.notna() & ~frame.geometry.is_empty]
    if nonempty.empty:
        return None
    try:
        bounds = gpd.GeoSeries(nonempty, crs=source_crs).to_crs("EPSG:4326").total_bounds
        longitude = (bounds[0] + bounds[2]) / 2
        latitude = (bounds[1] + bounds[3]) / 2
        return determine_utm_crs(longitude, latitude)
    except AppError:
        raise
    except Exception as exc:
        raise AppError("CRS_TRANSFORM_FAILED", "Could not determine a metric CRS for this dataset.") from exc


