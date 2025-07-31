from datetime import datetime
from typing import Optional

from core.database import Base
from core.utils import generate_ulid, utc_now
from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=generate_ulid, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String)
    creator_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), onupdate=utc_now)

    creator = relationship("User", back_populates="events")
    participants = relationship(
        "UserEvent", back_populates="event", cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_events_creator_start_time', 'creator_id', 'start_time'),
        Index('ix_events_start_end_time', 'start_time', 'end_time'),
        Index('ix_events_title_creator', 'title', 'creator_id'),
    )
