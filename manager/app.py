from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from manager.config import settings
from manager.api.routers import health
from manager.api.routers import metadata
from manager.services.metadata_db.pool import init_pool

def create_app(test_dsn: str | None = None) -> FastAPI:
    app = FastAPI(title="meta-database manager", debug=settings.DEBUG)
    
    # TODO: Initialize pool with db connection. Is it correct?
    if test_dsn is None:
        init_pool(settings.METADB_DSN)
    else:
        init_pool(test_dsn)

    app.include_router(health.router, tags=["health"])
    app.include_router(metadata.router, tags=["metadata"], prefix="/api")
    
    static_dir = Path(__file__).parent / "static"
    # mount at "/" so GET / serves index.html automatically
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="frontend")

    return app