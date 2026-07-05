import logging
import sys
import json
from datetime import datetime, timezone
from typing import Any

class StructuredJSONFormatter(logging.Formatter):
    """
    Format standard python logs into a clean, modern structured JSON schema
    perfect for containerized streaming, log aggregators, and system debugging.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_data: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "file": record.pathname,
            "line": record.lineno,
        }
        
        # Merge extra context fields if present
        if hasattr(record, "extra") and isinstance(record.extra, dict): # type: ignore
            log_data.update(record.extra) # type: ignore

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)

def setup_logging(level: int = logging.INFO) -> None:
    """Configures structured logs pointing to sys.stdout."""
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Clean existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(StructuredJSONFormatter())
    root_logger.addHandler(console_handler)

# Export standard logger
logger = logging.getLogger("mergelens")
logger.setLevel(logging.INFO)
