from datetime import datetime
from typing import Optional

from core.database import Base
from core.utils import generate_ulid, utc_now
from sqlalchemy import Boolean, DateTime, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=generate_ulid, index=True)
    email: Mapped[str] = mapped_column(
        String, unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(
        String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), onupdate=utc_now)

    events = relationship("Event", back_populates="creator")
    event_participants = relationship("UserEvent", back_populates="user")

    __table_args__ = (
        Index('ix_users_email_active', 'email', 'is_active'),
        Index('ix_users_username_active', 'username', 'is_active'),
    )
