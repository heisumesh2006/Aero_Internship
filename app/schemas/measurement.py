from typing import Any

from pydantic import BaseModel


class MeasurementResponse(BaseModel):
    type: str | None
    value: float | None
    unit: str | None
    status: str
    message: str | None


