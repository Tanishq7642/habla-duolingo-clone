"""Smart practice: a session built from the learner's weakest exercises.

Practice never costs hearts and earns one back, which is the "earn a heart"
escape hatch from the out-of-hearts modal.
"""

import random

from sqlalchemy.orm import Session

from app.core.config import GameRules
from app.core.errors import Conflict
from app.models import User
from app.repositories import content as content_repo
from app.repositories import progress as progress_repo
from app.schemas.session import PracticeSummaryOut, SessionOut
from app.services import path_service, session_service


def _candidate_ids(db: Session, user: User, rules: GameRules) -> list[int]:
    size = rules.practice_session_size
    weak = progress_repo.weak_exercise_ids(db, user.id, size)
    if len(weak) >= size:
        return weak
    # Top up with exercises from lessons the learner has already completed.
    completed_lessons = [lid for lid, n in progress_repo.lesson_completions(db, user.id).items() if n > 0]
    pool = [e.id for lid in completed_lessons for e in content_repo.lesson_exercises(db, lid) if e.id not in weak]
    random.shuffle(pool)
    return weak + pool[: size - len(weak)]


def summary(db: Session, user: User, rules: GameRules) -> PracticeSummaryOut:
    weak = len(progress_repo.weak_exercise_ids(db, user.id, rules.practice_session_size))
    has_completed = any(n > 0 for n in progress_repo.lesson_completions(db, user.id).values())
    available = weak > 0 or has_completed
    return PracticeSummaryOut(
        weak_exercises=weak,
        available=available,
        reason=None if available else "Complete your first lesson to unlock practice.",
    )


def start(db: Session, user: User, rules: GameRules) -> SessionOut:
    path_service.active_course(db, user)  # enrolment check
    ids = _candidate_ids(db, user, rules)
    if not ids:
        raise Conflict("Complete a lesson first, then come back to practice.", code="nothing_to_practice")
    attempt = session_service.create_session(db, user, kind="practice", lesson_id=None, exercise_ids=ids)
    return session_service.session_view(db, user, attempt, resumed=False)
