import uvicorn
from api.main import app
from core.config import settings


def start_server():
    """Start the FastAPI server using uvicorn."""
    uvicorn.run(
        app,
        host='0.0.0.0',
        port=settings.port,
        reload=settings.environment != 'production',
        log_level=settings.log_level,
        access_log=False
    )


if __name__ == "__main__":
    start_server()
