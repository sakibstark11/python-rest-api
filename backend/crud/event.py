import asyncio
import datetime
from typing import Optional, Sequence

from crud.user import get_user_by_email
from models.event import Event
from models.user_event import UserEvent
from schemas.event import EventCreate, EventUpdate
from sqlalchemy import and_, delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


async def create_event(db: AsyncSession, event: EventCreate, creator_id: str) -> Event:
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


async def get_event_by_id(db: AsyncSession, event_id: str) -> Optional[Event]:
    result = await db.execute(
        select(Event)
        .options(selectinload(Event.participants).selectinload(UserEvent.user))
        .where(Event.id == event_id)
    )
    return result.scalar_one_or_none()


async def get_user_events(
    db: AsyncSession,
    user_id: str,
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[datetime.datetime] = None,
    end_date: Optional[datetime.datetime] = None,
) -> Sequence[Event]:
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
    db: AsyncSession, event_id: str, event_update: EventUpdate
) -> Optional[Event]:
    result = await db.execute(select(Event).where(Event.id == event_id))
    db_event = result.scalar_one_or_none()

    if not db_event:
        return None

    update_data = event_update.model_dump(exclude_unset=True)
    participant_emails = update_data.pop('participant_emails', None)

    for field, value in update_data.items():
        setattr(db_event, field, value)

    if participant_emails is not None:
        await update_event_participants(db, event_id, participant_emails)

    await db.commit()
    await db.refresh(db_event)
    return db_event


async def delete_event(db: AsyncSession, event_id: str) -> bool:
    result = await db.execute(select(Event).where(Event.id == event_id))
    db_event = result.scalar_one_or_none()

    if not db_event:
        return False

    await db.delete(db_event)
    await db.commit()
    return True


async def add_event_participant(
    db: AsyncSession, event_id: str, user_id: str
) -> UserEvent:
    db_user_event = UserEvent(
        user_id=user_id, event_id=event_id, status="invited")
    db.add(db_user_event)
    await db.commit()
    await db.refresh(db_user_event)
    return db_user_event


async def update_event_participation(
    db: AsyncSession, event_id: str, user_id: str, status: str
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
    db_user_event.responded_at = datetime.datetime.now(datetime.timezone.utc)

    await db.commit()
    await db.refresh(db_user_event)
    return db_user_event


async def get_user_participation(
    db: AsyncSession, event_id: str, user_id: str
) -> Optional[UserEvent]:
    result = await db.execute(
        select(UserEvent).where(
            and_(UserEvent.event_id == event_id, UserEvent.user_id == user_id)
        )
    )
    return result.scalar_one_or_none()


async def update_event_participants(
    db: AsyncSession, event_id: str, participant_emails: list[str]
) -> None:
    result = await db.execute(
        select(UserEvent).where(UserEvent.event_id == event_id)
    )
    current_participant_users = result.scalars().all()
    current_user_ids = {p.user_id for p in current_participant_users}

    users = await asyncio.gather(
        *(get_user_by_email(db, email=email) for email in participant_emails)
    )
    new_user_ids = {u.id for u in [user for user in users if user]}

    users_to_remove = current_user_ids - new_user_ids
    users_to_add = new_user_ids - current_user_ids

    if users_to_remove:
        await db.execute(
            delete(UserEvent).where(
                and_(
                    UserEvent.event_id == event_id,
                    UserEvent.user_id.in_(users_to_remove)
                )
            )
        )

    await asyncio.gather(
        *(add_event_participant(db, event_id=event_id, user_id=user_id)
          for user_id in users_to_add)
    )
