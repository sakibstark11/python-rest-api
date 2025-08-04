
from datetime import datetime
from typing import List, Optional

from core.database import get_db
from core.exceptions import CustomHTTPException, ErrorCode
from core.security import get_current_user
from crud.event import (add_event_participant, create_event, delete_event,
                        get_event_by_id, get_user_events,
                        get_user_participation, update_event,
                        update_event_participation)
from crud.user import get_user_by_email
from fastapi import APIRouter, Depends, Query, status
from models.user import User
from schemas.event import (EventCreate, EventInviteResponse, EventResponse,
                           EventUpdate)
from services.sse import SSEEventType, send_event_notification
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_new_event(
    event: EventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_event = await create_event(db=db, event=event, creator_id=current_user.id)

    if event.participant_emails:
        for email in event.participant_emails:
            participant = await get_user_by_email(db, email=email)
            if participant and participant.id != current_user.id:
                await add_event_participant(db, event_id=db_event.id, user_id=participant.id)
    return await get_event_by_id(db, event_id=db_event.id)


@router.get("/", response_model=List[EventResponse])
async def get_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    events = await get_user_events(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        start_date=start_date,
        end_date=end_date
    )
    return events


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_event = await get_event_by_id(db, event_id=event_id)
    if not db_event:
        raise CustomHTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code=ErrorCode.EVENT_NOT_FOUND,
            detail="Event not found"
        )

    if (db_event.creator_id != current_user.id and
            not any(p.user_id == current_user.id for p in db_event.participants)):
        raise CustomHTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code=ErrorCode.ACCESS_DENIED,
            detail="Access denied to this event"
        )

    return db_event


@router.put("/{event_id}", response_model=EventResponse)
async def update_existing_event(
    event_id: str,
    event_update: EventUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_event = await get_event_by_id(db, event_id=event_id)
    if not db_event:
        raise CustomHTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code=ErrorCode.EVENT_NOT_FOUND,
            detail="Event not found"
        )

    if db_event.creator_id != current_user.id:
        raise CustomHTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code=ErrorCode.ACCESS_DENIED,
            detail="Only event creator can update the event"
        )

    old_participants = {p.user.id for p in db_event.participants}
    
    updated_event = await update_event(db=db, event_id=event_id, event_update=event_update)

    event_response = EventResponse.model_validate(updated_event)
    new_participants = {p.user.id for p in event_response.participants}
    
    current_users = new_participants.union({event_response.creator_id})
    await send_event_notification(SSEEventType.EVENT_UPDATED, event_response, current_users)
    
    removed_participants = old_participants - new_participants
    if removed_participants:
        await send_event_notification(SSEEventType.EVENT_DELETED, event_response, removed_participants)

    return updated_event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_event = await get_event_by_id(db, event_id=event_id)
    if not db_event:
        raise CustomHTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code=ErrorCode.EVENT_NOT_FOUND,
            detail="Event not found"
        )

    if db_event.creator_id != current_user.id:
        raise CustomHTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code=ErrorCode.ACCESS_DENIED,
            detail="Only event creator can delete the event"
        )

    event_response = EventResponse.model_validate(db_event)

    await delete_event(db=db, event_id=event_id)

    event_users = {event_response.creator_id}.union({p.user.id for p in event_response.participants})
    await send_event_notification(SSEEventType.EVENT_DELETED, event_response, event_users)


@router.post("/{event_id}/invite", status_code=status.HTTP_201_CREATED)
async def invite_to_event(
    event_id: str,
    participant_email: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_event = await get_event_by_id(db, event_id=event_id)
    if not db_event:
        raise CustomHTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code=ErrorCode.EVENT_NOT_FOUND,
            detail="Event not found"
        )

    if db_event.creator_id != current_user.id:
        raise CustomHTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code=ErrorCode.ACCESS_DENIED,
            detail="Only event creator can invite participants"
        )

    participant = await get_user_by_email(db, email=participant_email)
    if not participant:
        raise CustomHTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code=ErrorCode.NOT_FOUND,
            detail="User not found"
        )

    existing_participation = await get_user_participation(db, event_id=event_id, user_id=participant.id)
    if existing_participation:
        raise CustomHTTPException(
            status_code=status.HTTP_409_CONFLICT,
            error_code=ErrorCode.CONFLICT,
            detail="User already invited to this event"
        )

    await add_event_participant(db, event_id=event_id, user_id=participant.id)

    updated_event = await get_event_by_id(db, event_id=event_id)
    event_response = EventResponse.model_validate(updated_event)
    event_users = {event_response.creator_id}.union({p.user.id for p in event_response.participants})
    await send_event_notification(SSEEventType.EVENT_INVITE_SENT, event_response, event_users)

    return {"message": "Invitation sent successfully"}


@router.post("/{event_id}/respond")
async def respond_to_event_invitation(
    event_id: str,
    response: EventInviteResponse,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    participation = await get_user_participation(db, event_id=event_id, user_id=current_user.id)
    if not participation:
        raise CustomHTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code=ErrorCode.NOT_FOUND,
            detail="You are not invited to this event"
        )

    await update_event_participation(
        db=db,
        event_id=event_id,
        user_id=current_user.id,
        status=response.status
    )

    updated_event = await get_event_by_id(db, event_id=event_id)
    event_response = EventResponse.model_validate(updated_event)
    event_users = {event_response.creator_id}.union({p.user.id for p in event_response.participants})
    await send_event_notification(SSEEventType.EVENT_RESPONSE_UPDATED, event_response, event_users)

    return {"message": f"Response updated to {response.status}"}
