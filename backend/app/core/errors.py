"""Domain errors.

Services raise these; a single exception handler in `main.py` maps them to an
HTTP status and a stable machine-readable `code`, so route handlers never
build error responses by hand and the frontend can branch on `code`.
"""


class DomainError(Exception):
    status_code = 400
    code = "bad_request"

    def __init__(self, message: str, *, code: str | None = None):
        super().__init__(message)
        self.message = message
        if code:
            self.code = code


class NotFound(DomainError):
    status_code = 404
    code = "not_found"


class Forbidden(DomainError):
    status_code = 403
    code = "forbidden"


class Conflict(DomainError):
    status_code = 409
    code = "conflict"


class PaymentRequired(DomainError):
    """Not enough in-app currency (gems)."""

    status_code = 402
    code = "insufficient_gems"


class InvalidAnswer(DomainError):
    """Answer payload is well-formed JSON but not valid for this exercise type."""

    status_code = 422
    code = "invalid_answer"
