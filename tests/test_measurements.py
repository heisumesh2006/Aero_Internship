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


def test_projected_measurements_and_multigeometries():
    crs = CRS.from_epsg(32643)
    square = Polygon([(0, 0), (10, 0), (10, 10), (0, 10)])
    line = LineString([(0, 0), (3, 4)])
    assert measure_geometry(square, crs, crs).value == 100
    assert measure_geometry(MultiPolygon([square, Polygon([(20, 0), (30, 0), (30, 10), (20, 10)])]), crs, crs).value == 200
    assert measure_geometry(line, crs, crs).value == 5
    assert measure_geometry(MultiLineString([line, line]), crs, crs).value == 10


def test_degrees_are_reprojected():
    line = LineString([(77.59, 12.97), (77.60, 12.97)])
    result = measure_geometry(line, CRS.from_epsg(4326), CRS.from_epsg(32643))
    assert result.status == MeasurementStatus.SUPPORTED
    assert 1000 < result.value < 1200


def test_unmeasured_and_invalid_geometries():
    crs = CRS.from_epsg(32643)
    assert measure_geometry(Point(0, 0), crs, crs).status == MeasurementStatus.NOT_REQUIRED
    assert measure_geometry(MultiPoint([(0, 0), (1, 1)]), crs, crs).status == MeasurementStatus.NOT_REQUIRED
    assert measure_geometry(GeometryCollection([Point(0, 0)]), crs, crs).status == MeasurementStatus.UNSUPPORTED
    assert measure_geometry(None, crs, crs).status == MeasurementStatus.INVALID_GEOMETRY
    assert measure_geometry(Polygon(), crs, crs).status == MeasurementStatus.INVALID_GEOMETRY


def test_existing_metric_crs_is_reused():
    frame = gpd.GeoDataFrame(geometry=[Point(500000, 1400000)], crs="EPSG:32643")
    assert determine_measurement_crs(frame, CRS.from_epsg(32643)).to_epsg() == 32643


def test_non_metric_projected_crs_selects_utm():
    geographic = gpd.GeoDataFrame(geometry=[Point(-74, 40.7)], crs="EPSG:4326")
    frame = geographic.to_crs("EPSG:2263")
    assert determine_measurement_crs(frame, CRS.from_epsg(2263)).to_epsg() == 32618


