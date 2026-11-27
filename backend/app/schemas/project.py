from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    category: str | None = Field(default=None, max_length=120)
    target_market: str | None = Field(default=None, max_length=120)
    description: str = Field(default="", max_length=10000)


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    category: str | None = Field(default=None, max_length=120)
    target_market: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=10000)
    status: str | None = Field(default=None, pattern="^(active|paused)$")


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str | None
    target_market: str | None
    description: str
    status: str
    created_at: datetime
    updated_at: datetime
    archived_at: datetime | None