import asyncio
import json
from typing import Dict, List, TypedDict

from core.logger import root_logger
from schemas.event import EventResponse


class SSEEventMessage(TypedDict):
    type: str
    data: EventResponse


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


async def send_event_notification(event_type: str, event_data: EventResponse) -> None:
    """Send event notification to relevant users"""
    if not active_connections:
        return

    relevant_users = get_relevant_users(event_data)
    if not relevant_users:
        return

    message = {
        "type": event_type,
        "data": event_data.model_dump(mode='json')
    }

    for user_id in relevant_users:
        if user_id in active_connections:
            try:
                await active_connections[user_id].put(message)
            except Exception as e:
                root_logger.error("Failed to send message to user",
                                  extra={"user_id": user_id, "error": e})
                remove_connection(user_id)

    root_logger.info("Event sent", extra={
                     "event_type": event_type,
                     "relevant_users": len(relevant_users)})


def get_relevant_users(event_data: EventResponse) -> List[str]:
    """Extract relevant user IDs from calendar event data"""
    users = [event_data.creator_id] + \
        [p.user.id for p in event_data.participants]

    return users
