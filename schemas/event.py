from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, validator


class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None


class EventCreate(EventBase):
    participant_emails: Optional[List[str]] = []
    
    @validator('end_time')
    def validate_end_time(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('End time must be after start time')
        return v
    
    @validator('title')
    def validate_title(cls, v):
        if len(v.strip()) == 0:
            raise ValueError('Title cannot be empty')
        if len(v) > 200:
            raise ValueError('Title cannot exceed 200 characters')
        return v.strip()


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    
    @validator('title')
    def validate_title(cls, v):
        if v is not None:
            if len(v.strip()) == 0:
                raise ValueError('Title cannot be empty')
            if len(v) > 200:
                raise ValueError('Title cannot exceed 200 characters')
        return v.strip() if v else v


class ParticipantResponse(BaseModel):
    id: int
    email: str
    username: str
    first_name: str
    last_name: str
    status: str
    invited_at: datetime
    responded_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class EventResponse(EventBase):
    id: int
    creator_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    participants: List[ParticipantResponse] = []
    
    class Config:
        from_attributes = True


class EventInviteResponse(BaseModel):
    event_id: int
    status: str
    
    @validator('status')
    def validate_status(cls, v):
        if v not in ['accepted', 'declined']:
            raise ValueError('Status must be either "accepted" or "declined"')
        return v
