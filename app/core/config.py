import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    app_name: str = "Geospatial File Measurement API"
    database_url: str = "sqlite:///./geospatial.db"
    upload_dir: Path = Path("uploads")
    max_upload_size_mb: int = 25
    log_level: str = "INFO"

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            app_name=os.getenv("APP_NAME", cls.app_name),
            database_url=os.getenv("DATABASE_URL", cls.database_url),
            upload_dir=Path(os.getenv("UPLOAD_DIR", "uploads")),
            max_upload_size_mb=int(os.getenv("MAX_UPLOAD_SIZE_MB", "25")),
            log_level=os.getenv("LOG_LEVEL", "INFO"),
        )

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024
