from datetime import datetime, timedelta, timezone
from typing import Any

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


def create_access_token(data: dict[str, Any]):
    expire = datetime.now(timezone.utc) + \
        timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({
        **data,
        "exp": expire,
        "type": "access"},
        settings.secret_key,
        algorithm=settings.algorithm)


def create_refresh_token(data: dict[str, Any]):
    expire = datetime.now(timezone.utc) + \
        timedelta(days=settings.refresh_token_expire_days)
    return jwt.encode({
        **data,
        "exp": expire,
        "type": "refresh"},
        settings.secret_key,
        algorithm=settings.algorithm)


def verify_token(token: str, token_type: str = "access") -> TokenData:
    try:
        payload = jwt.decode(token, settings.secret_key,
                             algorithms=[settings.algorithm])
        user_id = payload.get("sub")

        if user_id is None:
            raise CustomHTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                error_code=ErrorCode.TOKEN_INVALID,
                detail="Invalid token"
            )

        token_type_from_payload = payload.get("type")
        if token_type_from_payload != token_type:
            raise CustomHTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                error_code=ErrorCode.TOKEN_INVALID,
                detail=f"Invalid token type. Expected {token_type}"
            )

        token_data = TokenData(user_id=user_id)
        return token_data
    except JWTError as exc:
        raise CustomHTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code=ErrorCode.TOKEN_INVALID,
            detail="Could not validate credentials"
        ) from exc


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
