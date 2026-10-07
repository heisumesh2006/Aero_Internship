from datetime import datetime

import numpy as np
import pandas as pd
from shapely.geometry import GeometryCollection, Point

from app.utils.geometry import geometry_geojson, json_safe


def test_properties_are_strict_json_values():
    value = {"number": np.int64(4), "missing": np.nan, "nullable": pd.NA, "date": datetime(2026, 1, 2), "items": [np.float64(1.5), None]}
    assert json_safe(value) == {"number": 4, "missing": None, "nullable": None, "date": "2026-01-02T00:00:00", "items": [1.5, None]}


def test_geometry_collection_serializes():
    assert geometry_geojson(GeometryCollection([Point(1, 2)]))["type"] == "GeometryCollection"
    assert geometry_geojson(None) is None
