from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.router import api_router
from app.core.config import settings
from app.db.session import engine
from app.services.instance_lock import acquire_instance_lock


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.database_dir.mkdir(parents=True, exist_ok=True)
    settings.storage_dir.mkdir(parents=True, exist_ok=True)
    settings.backups_dir.mkdir(parents=True, exist_ok=True)

    with acquire_instance_lock():
        with engine.begin() as connection:
            connection.execute(text("PRAGMA journal_mode=WAL"))
        yield


app = FastAPI(
    title="Nextly Local API",
    version=settings.app_version,
    description="Local-first API for Nextly 3.0.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:4173",
        "http://localhost:4173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)

app.include_router(api_router, prefix="/api")