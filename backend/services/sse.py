import asyncio
from enum import Enum
from typing import Dict, TypedDict, Union, Optional

from core.logger import root_logger
from schemas.event import EventResponse


class SSEEventType(str, Enum):
    """SSE Event types for real-time notifications."""

    CONNECTED = "connected"
    EVENT_UPDATED = "event_updated"
    EVENT_INVITE_SENT = "event_invite_sent"
    EVENT_RESPONSE_UPDATED = "event_response_updated"
    EVENT_DELETED = "event_deleted"


class SSEEventMessage(TypedDict):
    type: SSEEventType
    data: Optional[EventResponse]


# Store active SSE connections: user_id -> queue
active_connections: Dict[str, asyncio.Queue[SSEEventMessage]] = {}


def add_connection(user_id: str, connection_queue: asyncio.Queue[SSEEventMessage]) -> None:
    """Add a new SSE connection queue for a user"""
    active_connections[user_id] = connection_queue
    root_logger.info("SSE connection added", extra={
                     "user_id": user_id, "total_connections": len(active_connections)})


def remove_connection(user_id: str) -> None:
    """Remove an SSE connection queue for a user"""
    if user_id in active_connections:
        del active_connections[user_id]
    root_logger.info("SSE connection removed", extra={
                     "user_id": user_id})


async def send_event_notification(event_type: SSEEventType, event_data: EventResponse, user_ids: set[str]) -> None:
    """Send event notification to specified users"""
    if not active_connections or not user_ids:
        return

    message = SSEEventMessage(
        type=event_type,
        data=event_data
    )

    for user_id in user_ids:
        if user_id in active_connections:
            try:
                await active_connections[user_id].put(message)
            except Exception as e:
                root_logger.error("Failed to send message to user",
                                  extra={"user_id": user_id, "error": str(e)})
                remove_connection(user_id)

    root_logger.info("Event sent", extra={
                     "event_type": event_type,
                     "user_count": len(user_ids)})
