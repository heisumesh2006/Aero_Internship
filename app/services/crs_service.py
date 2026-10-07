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


