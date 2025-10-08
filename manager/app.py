from fastapi import FastAPI
from .config import settings

def create_app() -> FastAPI:
    app = FastAPI(title="meta-database manager", debug=settings.DEBUG)

    app.include_router() # TODO: add some routers.

    return app

app = create_app()