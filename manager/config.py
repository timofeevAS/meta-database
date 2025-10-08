from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    METADB_DSN: str = Field("postgresql://username:password@localhost:5432/app", env="METADB_DSN")
    DEBUG: bool = Field(True, env="DEBUG")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Global variable. TODO: is it good?
settings = Settings()
