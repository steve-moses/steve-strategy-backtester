from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    allowed_origins: str = "http://localhost:3000"
    cache_ttl_seconds: int = 300

    model_config = {"env_file": ".env"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
