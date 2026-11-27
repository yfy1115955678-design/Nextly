from fastapi import APIRouter

from app.api.routes import backups, files, health, projects

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(projects.router)
api_router.include_router(files.router)
api_router.include_router(backups.router)