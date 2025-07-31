from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, field_validator, model_validator


class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None

    @model_validator(mode='after')
    def validate_event_times(self):
        if hasattr(self, 'start_time') and hasattr(self, 'end_time'):
            if self.start_time and self.end_time and self.end_time <= self.start_time:
                raise ValueError('End time must be after start time')
        return self

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: Optional[str]):
        if not v or len(v.strip()) == 0:
            raise ValueError('Title cannot be empty')
        if len(v) > 200:
            raise ValueError('Title cannot exceed 200 characters')
        return v.strip()


class EventCreate(EventBase):
    participant_emails: Optional[List[str]] = []


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    participant_emails: Optional[List[str]] = None


class UserInfo(BaseModel):
    id: str
    email: str
    username: str
    first_name: str
    last_name: str

    class Config:
        from_attributes = True


class ParticipantResponse(BaseModel):
    user: UserInfo
    status: str
    invited_at: datetime
    responded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EventResponse(EventBase):
    id: str
    creator_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    participants: List[ParticipantResponse] = []

    class Config:
        from_attributes = True


class EventInviteResponse(BaseModel):
    status: str

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: Optional[str]):
        if v not in ['accepted', 'declined']:
            raise ValueError('Status must be either "accepted" or "declined"')
        return v
