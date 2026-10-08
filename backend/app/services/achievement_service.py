"""Data-driven achievements.

An achievement row says "unlock when <metric> >= <threshold>". This module
only knows how to *measure* metrics; which achievements exist, their copy and
thresholds are seed data. Adding "500 XP" is an INSERT, not a deploy.
"""

from collections.abc import Callable
from datetime import datetime

from sqlalchemy.orm import Session

from app.models import User, UserAchievement
from app.repositories import progress as progress_repo
from app.schemas.learner import AchievementOut

Metric = Callable[[Session, User], int]

METRICS: dict[str, Metric] = {
    "lessons_completed": lambda db, u: progress_repo.count_completed(db, u.id),
    "perfect_lessons": lambda db, u: progress_repo.count_completed(db, u.id, perfect_only=True),
    "skills_completed": lambda db, u: progress_repo.count_skills_completed(db, u.id),
    "practice_sessions": lambda db, u: progress_repo.count_completed(db, u.id, kind="practice"),
    "total_xp": lambda db, u: u.total_xp,
    "streak": lambda db, u: u.current_streak,
}


def _measure(db: Session, user: User, metrics: set[str]) -> dict[str, int]:
    return {m: METRICS[m](db, user) for m in metrics if m in METRICS}


def evaluate(db: Session, user: User, now: datetime, attempt_id: int | None) -> list[UserAchievement]:
    """Unlock every achievement whose threshold is now met. Runs inside the
    caller's transaction; the (user, achievement) unique constraint makes a
    double unlock impossible even if this were called twice."""
    owned = {ua.achievement_id for ua in progress_repo.user_achievements(db, user.id)}
    pending = [a for a in progress_repo.all_achievements(db) if a.id not in owned]
    if not pending:
        return []
    db.flush()  # make this session's writes visible to the metric queries
    values = _measure(db, user, {a.metric for a in pending})
    unlocked = []
    for a in pending:
        if values.get(a.metric, 0) >= a.threshold:
            ua = UserAchievement(user_id=user.id, achievement_id=a.id, unlocked_at=now, attempt_id=attempt_id)
            db.add(ua)
            unlocked.append(ua)
    return unlocked


def list_for_user(db: Session, user: User) -> list[AchievementOut]:
    owned = {ua.achievement_id: ua.unlocked_at for ua in progress_repo.user_achievements(db, user.id)}
    defs = progress_repo.all_achievements(db)
    values = _measure(db, user, {a.metric for a in defs})
    return [
        AchievementOut(
            code=a.code,
            title=a.title,
            description=a.description,
            icon=a.icon,
            threshold=a.threshold,
            progress=min(values.get(a.metric, 0), a.threshold),
            unlocked_at=owned.get(a.id),
        )
        for a in defs
    ]


def to_out(achievements, unlocked_at: datetime | None) -> list[AchievementOut]:
    return [
        AchievementOut(code=a.code, title=a.title, description=a.description, icon=a.icon,
                       threshold=a.threshold, progress=a.threshold, unlocked_at=unlocked_at)
        for a in achievements
    ]
