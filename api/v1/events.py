
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user
from core.exceptions import CustomHTTPException, ErrorCode
from schemas.event import EventCreate, EventUpdate, EventResponse, EventInviteResponse
from crud.event import (
    create_event, get_event_by_id, get_user_events, update_event,
    delete_event, add_event_participant, update_event_participation,
    get_user_participation
)
from crud.user import get_user_by_email
from models.user import User

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
    event_id: int,
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
    event_id: int,
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

    updated_event = await update_event(db=db, event_id=event_id, event_update=event_update)
    return updated_event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_event(
    event_id: int,
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

    await delete_event(db=db, event_id=event_id)


@router.post("/{event_id}/invite", status_code=status.HTTP_201_CREATED)
async def invite_to_event(
    event_id: int,
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
    return {"message": "Invitation sent successfully"}


@router.post("/{event_id}/respond")
async def respond_to_event_invitation(
    event_id: int,
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

    return {"message": f"Response updated to {response.status}"}
