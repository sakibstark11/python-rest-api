from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from core.exceptions import CustomHTTPException, ErrorCode
from crud.user import get_user_by_id
from schemas.auth import TokenData

security = HTTPBearer()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> TokenData:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: int = payload.get("sub")
        token_type_from_payload: str = payload.get("type")
        
        if user_id is None:
            raise CustomHTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                error_code=ErrorCode.TOKEN_INVALID,
                detail="Invalid token"
            )
        
        if token_type_from_payload != token_type:
            raise CustomHTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                error_code=ErrorCode.TOKEN_INVALID,
                detail=f"Invalid token type. Expected {token_type}"
            )
            
        token_data = TokenData(user_id=user_id)
        return token_data
    except JWTError:
        raise CustomHTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code=ErrorCode.TOKEN_INVALID,
            detail="Could not validate credentials"
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    token = credentials.credentials
    token_data = verify_token(token)
    
    user = await get_user_by_id(db, user_id=token_data.user_id)
    if user is None:
        raise CustomHTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code=ErrorCode.AUTHENTICATION_ERROR,
            detail="User not found"
        )
    
    if not user.is_active:
        raise CustomHTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code=ErrorCode.AUTHENTICATION_ERROR,
            detail="Inactive user"
        )
    
    return user    
    return user    
    return user
