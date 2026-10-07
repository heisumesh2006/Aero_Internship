from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import FileStatus
from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


