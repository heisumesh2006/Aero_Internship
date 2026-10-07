from typing import Any

from pydantic import BaseModel


class MeasurementResponse(BaseModel):
    type: str | None
    value: float | None
    unit: str | None
    status: str
    message: str | None


class FeatureResponse(BaseModel):
    feature_index: int
    external_feature_id: str | None
    geometry_type: str | None
    geometry: dict[str, Any] | None
    properties: dict[str, Any]
    source_crs: str
    measurement_crs: str | None
    measurement: MeasurementResponse


class FileMeasurementsResponse(BaseModel):
    file_id: str
    filename: str
    source_crs: str | None
    measurement_crs: str | None
    feature_count: int
    features: list[FeatureResponse]
