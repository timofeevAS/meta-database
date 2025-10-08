from fastapi import FastAPI
from config import settings

from api.routers import health

def create_app() -> FastAPI:
    app = FastAPI(title="meta-database manager", debug=settings.DEBUG)

    app.include_router(health.router, tags=["health"])

    return app

app = create_app()