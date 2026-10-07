from typing import Any

from sqlalchemy import ForeignKey, Integer, JSON, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Feature(Base):
    __tablename__ = "features"
    __table_args__ = (UniqueConstraint("uploaded_file_id", "feature_index"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    uploaded_file_id: Mapped[str] = mapped_column(ForeignKey("uploaded_files.id"), index=True)
    feature_index: Mapped[int] = mapped_column(Integer)
    external_feature_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    geometry_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    geometry_geojson: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    properties_json: Mapped[dict[str, Any]] = mapped_column(JSON)
    source_crs: Mapped[str] = mapped_column(String(100))
    measurement_crs: Mapped[str | None] = mapped_column(String(100), nullable=True)
    measurement_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    measurement_value: Mapped[float | None] = mapped_column(Numeric(20, 6), nullable=True)
    measurement_unit: Mapped[str | None] = mapped_column(String(10), nullable=True)
    measurement_status: Mapped[str] = mapped_column(String(30))
    measurement_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    uploaded_file: Mapped["UploadedFile"] = relationship(back_populates="features")


from app.models.uploaded_file import UploadedFile  # noqa: E402
