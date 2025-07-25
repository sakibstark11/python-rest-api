from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from core.database import Base


class UserEvent(Base):
    __tablename__ = "user_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    status = Column(String, default="invited")  # invited, accepted, declined
    invited_at = Column(DateTime(timezone=True), server_default=func.now())
    responded_at = Column(DateTime(timezone=True))

    user = relationship("User", back_populates="event_participants")
    event = relationship("Event", back_populates="participants")

    __table_args__ = (
        Index('ix_user_events_user_event', 'user_id', 'event_id', unique=True),
        Index('ix_user_events_event_status', 'event_id', 'status'),
        Index('ix_user_events_user_status', 'user_id', 'status'),
    )
