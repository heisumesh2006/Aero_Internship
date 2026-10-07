import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.routes.files import router as files_router
from app.api.routes.health import router as health_router
from app.core.config import Settings
from app.core.exceptions import AppError, app_error_handler
from app.db.base import Base
from app.db.database import make_engine, make_session_factory
import app.models  # noqa: F401 - registers ORM tables


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings.from_env()
    logging.basicConfig(level=settings.log_level.upper())
    engine = make_engine(settings.database_url)

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        settings.upload_dir.mkdir(parents=True, exist_ok=True)
        Base.metadata.create_all(engine)
        yield
        engine.dispose()

    application = FastAPI(
        title=settings.app_name,
        description="Upload KML or zipped ESRI Shapefiles and retrieve CRS-aware feature measurements.",
        version="1.0.0",
        lifespan=lifespan,
    )
    application.state.settings = settings
    application.state.session_factory = make_session_factory(engine)
    application.add_exception_handler(AppError, app_error_handler)

    @application.exception_handler(Exception)
    async def unexpected_error(_request: Request, exc: Exception) -> JSONResponse:
        logging.getLogger(__name__).exception("Unhandled request error", exc_info=exc)
        return JSONResponse(status_code=500, content={"error": {"code": "INTERNAL_ERROR", "message": "An internal error occurred."}})

    application.include_router(health_router)
    application.include_router(files_router)
    return application


app = create_app()
