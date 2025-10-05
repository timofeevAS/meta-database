from dataclasses import dataclass
import os

@dataclass
class TestDBConfig:
    host: str = os.getenv("TEST_DB_HOST", "localhost")
    port: int = int(os.getenv("TEST_DB_PORT", 55432))
    dbname: str = os.getenv("TEST_DB_NAME", "metadata_test")
    user: str = os.getenv("TEST_DB_USER", "testuser")
    password: str = os.getenv("TEST_DB_PASSWORD", "testpass")

config = TestDBConfig()