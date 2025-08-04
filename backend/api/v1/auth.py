from core.config import settings
from core.database import get_db
from core.exceptions import CustomHTTPException, ErrorCode
from core.refresh_token_store import refresh_token_store
from core.security import (create_access_token, create_refresh_token,
                           get_current_user, verify_token)
from crud.user import (authenticate_user, create_user, get_user_by_email,
                       get_user_by_id, get_user_by_username)
from fastapi import APIRouter, Depends, Request, Response, status
from models.user import User
from schemas.auth import Token
from schemas.user import UserCreate, UserLogin, UserResponse
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db)):
    existing_user_email = await get_user_by_email(db, email=user.email)
    if existing_user_email:
        raise CustomHTTPException(
            status_code=status.HTTP_409_CONFLICT,
            error_code=ErrorCode.USER_EXISTS,
            detail="Email already registered"
        )

    existing_user_username = await get_user_by_username(db, username=user.username)
    if existing_user_username:
        raise CustomHTTPException(
            status_code=status.HTTP_409_CONFLICT,
            error_code=ErrorCode.USER_EXISTS,
            detail="Username already taken"
        )

    db_user = await create_user(db=db, user=user)
    return db_user


@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise CustomHTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code=ErrorCode.INVALID_CREDENTIALS,
            detail="Incorrect email or password"
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    refresh_token_store.store_token(str(user.id), refresh_token)

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.refresh_token_expire_days *
            24 * 60 * 60
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
async def token_refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise CustomHTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code=ErrorCode.AUTHENTICATION_ERROR,
            detail="Refresh token not found"
        )

    token_data = verify_token(refresh_token, token_type="refresh")

    if not refresh_token_store.is_token_valid(token_data.user_id, refresh_token):
        raise CustomHTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code=ErrorCode.AUTHENTICATION_ERROR,
            detail="Invalid refresh token"
        )

    user = await get_user_by_id(db, user_id=token_data.user_id)
    if not user:
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

    access_token = create_access_token(data={"sub": user.id})
    new_refresh_token = create_refresh_token(data={"sub": user.id})

    refresh_token_store.store_token(user.id, new_refresh_token)

    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False if settings.environment == "development" else True,
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60
    )

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user)
):
    refresh_token_store.revoke_token(str(current_user.id))

    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=False if settings.environment == "development" else True,
        samesite="lax"
    )

    return {"message": "Successfully logged out"}
