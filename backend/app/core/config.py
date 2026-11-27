from functools import lru_cache
from pathlib import Path

from platformdirs import user_data_dir
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Nextly"
    app_version: str = "3.0.0"
    host: str = "127.0.0.1"
    port: int = 8000
    data_dir: Path = Path(user_data_dir("Nextly", "Formyself"))
    max_upload_bytes: int = 100 * 1024 * 1024

    model_config = SettingsConfigDict(
        env_prefix="NEXTLY_",
        env_file=".env",
        extra="ignore",
    )

    @property
    def database_dir(self) -> Path:
        return self.data_dir / "database"

    @property
    def database_path(self) -> Path:
        return self.database_dir / "nextly.sqlite"

    @property
    def database_url(self) -> str:
        return "sqlite:///" + self.database_path.as_posix()

    @property
    def storage_dir(self) -> Path:
        return self.data_dir / "storage"

    @property
    def backups_dir(self) -> Path:
        return self.data_dir / "backups"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()