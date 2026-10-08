from fastapi import APIRouter

from app.api.deps import DB, CurrentUser, Now, Rules
from app.schemas.session import (
    AnswerIn,
    AnswerOut,
    CompletionOut,
    PracticeSummaryOut,
    ReviewOut,
    SessionOut,
)
from app.services import practice_service, session_service

router = APIRouter(tags=["sessions"])


@router.post("/lessons/{lesson_id}/start", response_model=SessionOut)
def start_lesson(lesson_id: int, db: DB, user: CurrentUser, rules: Rules):
    """Start a lesson, or resume the learner's open session for it."""
    return session_service.start_lesson(db, user, lesson_id, rules)


@router.get("/attempts/{attempt_id}", response_model=SessionOut)
def get_attempt(attempt_id: int, db: DB, user: CurrentUser):
    return session_service.get_session(db, user, attempt_id)


@router.post("/attempts/{attempt_id}/answers", response_model=AnswerOut)
def submit_answer(attempt_id: int, payload: AnswerIn, db: DB, user: CurrentUser):
    return session_service.submit_answer(db, user, attempt_id, payload.exercise_id, payload.answer)


@router.post("/attempts/{attempt_id}/complete", response_model=CompletionOut)
def complete_attempt(attempt_id: int, db: DB, user: CurrentUser, now: Now, rules: Rules):
    """Idempotent: repeating this call returns the original receipt."""
    return session_service.complete(db, user, attempt_id, now, rules)


@router.post("/attempts/{attempt_id}/abandon", response_model=SessionOut)
def abandon_attempt(attempt_id: int, db: DB, user: CurrentUser):
    return session_service.abandon(db, user, attempt_id)


@router.get("/attempts/{attempt_id}/review", response_model=ReviewOut)
def review_attempt(attempt_id: int, db: DB, user: CurrentUser):
    return session_service.review(db, user, attempt_id)


@router.get("/practice/summary", response_model=PracticeSummaryOut)
def practice_summary(db: DB, user: CurrentUser, rules: Rules):
    return practice_service.summary(db, user, rules)


@router.post("/practice/start", response_model=SessionOut)
def start_practice(db: DB, user: CurrentUser, rules: Rules):
    return practice_service.start(db, user, rules)
