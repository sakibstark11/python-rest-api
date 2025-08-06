import asyncio
import json

from core.logger import root_logger
from core.security import get_current_user
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from models.user import User
from services.sse import (SSEEventMessage, SSEEventType, add_connection,
                          remove_connection)

router = APIRouter()


@router.get("/events")
async def subscribe_to_events(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    async def event_stream():
        connection_queue: asyncio.Queue[SSEEventMessage] = asyncio.Queue()
        add_connection(current_user.id, connection_queue)

        connected_payload = {"type": SSEEventType.CONNECTED.value}
        yield f"data: {json.dumps(connected_payload)}\n\n"

        try:
            while True:
                if await request.is_disconnected():
                    break

                try:
                    message = await asyncio.wait_for(connection_queue.get(), timeout=1.0)
                    yield f"data: {json.dumps({"type": message["type"].value, "data": message["data"].model_dump(mode="json")})}\n\n"

                except asyncio.TimeoutError:
                    continue

        except Exception as e:  # pylint: disable=broad-exception-caught
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
