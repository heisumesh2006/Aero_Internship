"""Generate small Bengaluru-area demo files without checked-in binary fixtures."""

from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZipFile

import geopandas as gpd
from shapely.geometry import Polygon

ROOT = Path(__file__).resolve().parents[1] / "sample_data"

KML = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document>
<Placemark><name>Demo point</name><Point><coordinates>77.5946,12.9716,0</coordinates></Point></Placemark>
<Placemark><name>Demo route</name><LineString><coordinates>77.5946,12.9716,0 77.6000,12.9750,0</coordinates></LineString></Placemark>
<Placemark><name>Demo parcel</name><Polygon><outerBoundaryIs><LinearRing><coordinates>77.5946,12.9716,0 77.5956,12.9716,0 77.5956,12.9726,0 77.5946,12.9726,0 77.5946,12.9716,0</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>
</Document></kml>
"""


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    (ROOT / "bengaluru_demo.kml").write_text(KML, encoding="utf-8")
    polygon = Polygon([(77.5946, 12.9716), (77.5956, 12.9716), (77.5956, 12.9726), (77.5946, 12.9726)])
    frame = gpd.GeoDataFrame({"name": ["Demo parcel"]}, geometry=[polygon], crs="EPSG:4326")
    with TemporaryDirectory() as temporary:
        shp = Path(temporary) / "bengaluru_parcel.shp"
        frame.to_file(shp, engine="pyogrio")
        with ZipFile(ROOT / "bengaluru_parcel.zip", "w") as archive:
            for companion in shp.parent.glob("bengaluru_parcel.*"):
                archive.write(companion, companion.name)
    print(f"Generated sample files in {ROOT}")


if __name__ == "__main__":
    main()
