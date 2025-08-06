import time
from contextvars import ContextVar
from typing import Any, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from .logger import root_logger
from .utils import generate_ulid

request_id_context: ContextVar[str] = ContextVar('request_id', default='')


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable[..., Any]) -> Response:
        request_id = generate_ulid()

        request_id_context.set(request_id)

        request.state.request_id = request_id

        body_size = 0
        if hasattr(request, 'headers') and 'content-length' in request.headers:
            try:
                body_size = int(request.headers['content-length'])
            except (ValueError, KeyError):
                body_size = 0

        start_time = time.perf_counter()
        root_logger.info("request", extra={
            "method": request.method,
            "endpoint": request.url.path,
            "query_params": str(request.query_params) if request.query_params else None,
            "client_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
            "body_size": body_size
        })

        try:
            response = await call_next(request)

            response_time_ms = round(
                (time.perf_counter() - start_time) * 1000, 2)

            response_size = 0
            if hasattr(response, 'headers') and 'content-length' in response.headers:
                try:
                    response_size = int(response.headers['content-length'])
                except (ValueError, KeyError):
                    response_size = 0

            root_logger.info("response", extra={
                "method": request.method,
                "endpoint": request.url.path,
                "status_code": response.status_code,
                "response_time_ms": response_time_ms,
                "response_size": response_size
            })

            response.headers["X-Request-ID"] = request_id

            return response

        except Exception as exc:  # pylint: disable=broad-exception-caught
            response_time_ms = round(
                (time.perf_counter() - start_time) * 1000, 2)
            root_logger.error("Request failed with unhandled exception", extra={
                "method": request.method,
                "endpoint": request.url.path,
                "error": str(exc),
                "response_time_ms": response_time_ms
            }, exc_info=True)
            raise exc


def get_request_id() -> str:
    """Get the current request ID from context."""
    return request_id_context.get()
