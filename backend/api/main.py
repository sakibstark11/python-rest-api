from api.v1.router import api_router
from core.exceptions import setup_exception_handlers
from core.middleware import RequestIDMiddleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Calendar API",
    description="A REST API for calendar management with user authentication",
    version="1.0.0",
    redoc_url=None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RequestIDMiddleware)

setup_exception_handlers(app)

app.include_router(api_router, prefix="/v1")


@app.get("/")
async def root():
    return {"message": "Calendar API is running!"}
