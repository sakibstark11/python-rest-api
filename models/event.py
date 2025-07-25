from datetime import datetime
from typing import Optional

from sqlalchemy import (DateTime, ForeignKey, Index, Integer, String,
                        Text)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from core.database import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String)
    creator_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), default=func.now)
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), onupdate=func.now)

    creator = relationship("User", back_populates="events")
    participants = relationship(
        "UserEvent", back_populates="event", cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_events_creator_start_time', 'creator_id', 'start_time'),
        Index('ix_events_start_end_time', 'start_time', 'end_time'),
        Index('ix_events_title_creator', 'title', 'creator_id'),
        Index('ix_events_title_creator', 'title', 'creator_id'),
    )
