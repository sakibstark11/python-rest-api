from fastapi import APIRouter
from .auth import router as auth_router
from .events import router as events_router
from .sse import router as sse_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])
api_router.include_router(events_router, prefix="/events", tags=["events"])
api_router.include_router(sse_router, prefix="/sse", tags=["server-sent-events"])