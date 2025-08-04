from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1
    refresh_token_expire_days: int = 7
    port: int = 8000
    db_port: int = 5432
    redis_url: str = "redis://localhost:6379"
    redis_stream_name: str = "calendar:events"
    environment: str = "development"
    log_level: str = "debug"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
