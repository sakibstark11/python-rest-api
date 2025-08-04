import asyncio
import json

from core.logger import root_logger
from core.security import get_current_user
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from models.user import User
from services.sse import SSEEventMessage, add_connection, remove_connection

router = APIRouter()


@router.get("/events")
async def subscribe_to_events(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    async def event_stream():
        connection_queue: asyncio.Queue[SSEEventMessage] = asyncio.Queue()
        add_connection(current_user.id, connection_queue)

        try:
            yield "data: {\"type\": \"connected\", \"message\": \"SSE connection established\"}\n\n"

            while True:
                if await request.is_disconnected():
                    break

                try:
                    message = await asyncio.wait_for(connection_queue.get(), timeout=1.0)
                    yield f"data: {json.dumps(message)}\n\n"

                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    root_logger.error("Error processing message",
                                      extra={"user_id": current_user.id, "error": e})
                    continue

        except Exception as e:
            root_logger.error('SSE stream failed', extra={
                              'user_id': current_user.id, 'error': e})
        finally:
            remove_connection(current_user.id)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
