from enum import Enum
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from .logger import root_logger


class ErrorCode(str, Enum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR"
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    CONFLICT = "CONFLICT"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    BAD_REQUEST = "BAD_REQUEST"
    USER_EXISTS = "USER_EXISTS"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    TOKEN_INVALID = "TOKEN_INVALID"
    EVENT_NOT_FOUND = "EVENT_NOT_FOUND"
    ACCESS_DENIED = "ACCESS_DENIED"


class CustomHTTPException(HTTPException):
    def __init__(
        self,
        status_code: int,
        error_code: ErrorCode,
        detail: str,
        headers: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.error_code = error_code


async def custom_http_exception_handler(request: Request, exc: CustomHTTPException):
    root_logger.error("Custom HTTP exception", extra={
        "error_code": exc.error_code.value,
        "detail": exc.detail,
        "status_code": exc.status_code,
        "path": str(request.url)
    })
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code.value,
                "message": exc.detail,
            }
        }
    )


async def generic_http_exception_handler(request: Request, exc: HTTPException):
    root_logger.error("HTTP exception", extra={
        "detail": exc.detail,
        "status_code": exc.status_code,
        "path": str(request.url)
    })
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "HTTP_ERROR",
                "message": exc.detail,
            }
        }
    )


async def validation_exception_handler(request: Request, exc: ValidationError):
    root_logger.error("Validation error", extra={
        "errors": exc.errors(),
        "path": str(request.url)
    })
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": ErrorCode.VALIDATION_ERROR.value,
                "message": "Validation error",
                "details": exc.errors(),
            }
        }
    )


async def internal_error_handler(request: Request, exc: Exception):
    root_logger.error("Internal server error", extra={
        "error": str(exc),
        "type": type(exc).__name__,
        "path": str(request.url)
    }, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": ErrorCode.INTERNAL_ERROR.value,
                "message": "An internal server error occurred",
            }
        }
    )


def setup_exception_handlers(app: FastAPI):
    app.add_exception_handler(
        CustomHTTPException, custom_http_exception_handler)
    app.add_exception_handler(HTTPException, generic_http_exception_handler)
    app.add_exception_handler(ValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, internal_error_handler)
