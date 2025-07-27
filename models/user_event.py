from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from core.utils import generate_ulid, utc_now


class UserEvent(Base):
    __tablename__ = "user_events"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=generate_ulid, index=True)
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False)
    event_id: Mapped[str] = mapped_column(
        String, ForeignKey("events.id"), nullable=False)
    status: Mapped[str] = mapped_column(
        String, default="invited")
    invited_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now)
    responded_at: Mapped[Optional[datetime]
                         ] = mapped_column(DateTime(timezone=True))

    user = relationship("User", back_populates="event_participants")
    event = relationship("Event", back_populates="participants")

    __table_args__ = (
        Index('ix_user_events_user_event', 'user_id', 'event_id', unique=True),
        Index('ix_user_events_event_status', 'event_id', 'status'),
        Index('ix_user_events_user_status', 'user_id', 'status'),
    )
