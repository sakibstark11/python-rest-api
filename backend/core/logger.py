import json
import logging
import sys
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""

    def format(self, record: logging.LogRecord):
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }

        try:
            from .middleware import get_request_id
            request_id = get_request_id()
            if request_id:
                log_entry["request_id"] = request_id
        except (ImportError, LookupError):
            pass

        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Add extra fields from logging extra parameter
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 'pathname', 'filename',
                           'module', 'lineno', 'funcName', 'created', 'msecs', 'relativeCreated',
                           'thread', 'threadName', 'processName', 'process', 'getMessage', 'exc_info',
                           'exc_text', 'stack_info', 'taskName']:
                log_entry[key] = value

        return json.dumps(log_entry)


def setup_logger(
    name: str = "calendar-api",
    level: str = "INFO",
) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))

    for handler in logger.handlers[:]:
        logger.removeHandler(handler)

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(getattr(logging, level.upper()))

    formatter = JSONFormatter()

    handler.setFormatter(formatter)

    # Add handler to logger
    logger.addHandler(handler)

    return logger


root_logger = setup_logger()
