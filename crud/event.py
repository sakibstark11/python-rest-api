from datetime import datetime
from typing import List, Optional

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.event import Event
from models.user_event import UserEvent
from schemas.event import EventCreate, EventUpdate


async def create_event(db: AsyncSession, event: EventCreate, creator_id: int) -> Event:
    db_event = Event(
        title=event.title,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        location=event.location,
        creator_id=creator_id,
    )
    db.add(db_event)
    await db.commit()
    await db.refresh(db_event)
    return db_event


async def get_event_by_id(db: AsyncSession, event_id: int) -> Optional[Event]:
    result = await db.execute(
        select(Event)
        .options(selectinload(Event.participants).selectinload(UserEvent.user))
        .where(Event.id == event_id)
    )
    return result.scalar_one_or_none()


async def get_user_events(
    db: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> List[Event]:
    query = (
        select(Event)
        .options(selectinload(Event.participants).selectinload(UserEvent.user))
        .where(
            or_(
                Event.creator_id == user_id,
                Event.participants.any(UserEvent.user_id == user_id),
            )
        )
    )

    if start_date:
        query = query.where(Event.start_time >= start_date)
    if end_date:
        query = query.where(Event.end_time <= end_date)

    query = query.offset(skip).limit(limit).order_by(Event.start_time)

    result = await db.execute(query)
    return result.scalars().all()


async def update_event(
    db: AsyncSession, event_id: int, event_update: EventUpdate
) -> Optional[Event]:
    result = await db.execute(select(Event).where(Event.id == event_id))
    db_event = result.scalar_one_or_none()

    if not db_event:
        return None

    update_data = event_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_event, field, value)

    await db.commit()
    await db.refresh(db_event)
    return db_event


async def delete_event(db: AsyncSession, event_id: int) -> bool:
    result = await db.execute(select(Event).where(Event.id == event_id))
    db_event = result.scalar_one_or_none()

    if not db_event:
        return False

    await db.delete(db_event)
    await db.commit()
    return True


async def add_event_participant(
    db: AsyncSession, event_id: int, user_id: int
) -> UserEvent:
    db_user_event = UserEvent(user_id=user_id, event_id=event_id, status="invited")
    db.add(db_user_event)
    await db.commit()
    await db.refresh(db_user_event)
    return db_user_event


async def update_event_participation(
    db: AsyncSession, event_id: int, user_id: int, status: str
) -> Optional[UserEvent]:
    result = await db.execute(
        select(UserEvent).where(
            and_(UserEvent.event_id == event_id, UserEvent.user_id == user_id)
        )
    )
    db_user_event = result.scalar_one_or_none()

    if not db_user_event:
        return None

    db_user_event.status = status
    db_user_event.responded_at = datetime.utcnow()

    await db.commit()
    await db.refresh(db_user_event)
    return db_user_event


async def get_user_participation(
    db: AsyncSession, event_id: int, user_id: int
) -> Optional[UserEvent]:
    result = await db.execute(
        select(UserEvent).where(
            and_(UserEvent.event_id == event_id, UserEvent.user_id == user_id)
        )
    )
    return result.scalar_one_or_none()
