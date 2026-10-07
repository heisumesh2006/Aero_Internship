import tempfile
from pathlib import Path

import geopandas as gpd

from app.core.exceptions import AppError
from app.utils.safe_zip import extract_single_shapefile


def read_dataset(path: Path, file_type: str) -> gpd.GeoDataFrame:
    try:
        if file_type == "KML":
            frame = gpd.read_file(path, driver="KML", engine="pyogrio")
            if frame.crs is None:
                frame.set_crs("EPSG:4326", inplace=True)
            return frame
        with tempfile.TemporaryDirectory(prefix="shapefile-") as temporary:
            shapefile = extract_single_shapefile(path, Path(temporary))
            frame = gpd.read_file(shapefile, engine="pyogrio")
        if frame.crs is None:
            raise AppError("MISSING_CRS", "Shapefile has no usable .prj CRS; provide a valid .prj file.")
        return frame
    except AppError:
        raise
    except Exception as exc:
        raise AppError("INVALID_GEOSPATIAL_FILE", f"Could not read {file_type.lower()} data.") from exc
