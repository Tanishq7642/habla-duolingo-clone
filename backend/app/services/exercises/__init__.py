from app.services.exercises import handlers as _handlers  # noqa: F401  (registers types)
from app.services.exercises.registry import (
    CheckResult,
    answer_text,
    get_handler,
    registered_types,
    solution_text,
)

__all__ = ["CheckResult", "answer_text", "get_handler", "registered_types", "solution_text"]
