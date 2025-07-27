from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


class UserBase(BaseModel):
    email: EmailStr
    username: str
    first_name: str
    last_name: str

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str):
        if not v or len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        if not v.isalnum():
            raise ValueError(
                'Username must contain only alphanumeric characters')
        return v

    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_names(cls, v: str):
        if not v or len(v.strip()) == 0:
            raise ValueError('Name cannot be empty')
        return v.strip()


class UserCreate(UserBase):
    password: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str):
        if not v or len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError(
                'Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError(
                'Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_names(cls, v: Optional[str]):
        if v is not None and len(v.strip()) == 0:
            raise ValueError('Name cannot be empty')
        return v
