from manager.app import app
from manager.config import settings
from manager.services.metadata_db.pool import init_pool

def startup() -> None:
    init_pool(settings.METADB_DSN)

if __name__ == '__main__':
    # Run application:
    # uvicorn manager.main:app --reload
    startup()