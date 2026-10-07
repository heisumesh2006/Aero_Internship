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


