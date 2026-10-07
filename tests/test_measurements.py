from pyproj import CRS
import pytest
from shapely.geometry import GeometryCollection, LineString, MultiLineString, MultiPoint, MultiPolygon, Point, Polygon

from app.core.constants import MeasurementStatus
from app.core.exceptions import AppError
from app.services.crs_service import determine_measurement_crs, determine_utm_crs, normalize_crs
import geopandas as gpd
from app.services.measurement_service import measure_geometry


def test_utm_zones_and_hemispheres():
    assert determine_utm_crs(77.6, 12.9).to_epsg() == 32643
    assert determine_utm_crs(77.6, -12.9).to_epsg() == 32743
    assert determine_utm_crs(-74, 40).to_epsg() == 32618
    assert determine_utm_crs(180, 0).to_epsg() == 32660
    assert determine_utm_crs(-180, 0).to_epsg() == 32601


