from manager.app import create_app
from manager.config import settings

app = create_app()

if __name__ == '__main__':
    # Run application:
    # uvicorn manager.main:app --reload
    pass