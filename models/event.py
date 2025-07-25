from sqlalchemy import (Column, DateTime, ForeignKey, Index, Integer, String,
                        Text)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from core.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    location = Column(String)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", back_populates="events")
    participants = relationship("UserEvent", back_populates="event", cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_events_creator_start_time', 'creator_id', 'start_time'),
        Index('ix_events_start_end_time', 'start_time', 'end_time'),
        Index('ix_events_title_creator', 'title', 'creator_id'),
        Index('ix_events_title_creator', 'title', 'creator_id'),
    )
