"""Learner progress, sessions and activity queries."""

from datetime import date, datetime

from sqlalchemy import case, func, select, update
from sqlalchemy.orm import Session, selectinload

from app.models import (
    Achievement,
    AttemptExercise,
    DailyActivity,
    ExerciseAttempt,
    LessonAttempt,
    User,
    UserAchievement,
    UserLessonProgress,
    UserSkillProgress,
)


# ------------------------------------------------------------------ users
def get_user(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.scalar(select(User).where(User.username == username))


# ------------------------------------------------------------------ lesson progress
def lesson_completions(db: Session, user_id: int) -> dict[int, int]:
    rows = db.execute(
        select(UserLessonProgress.lesson_id, UserLessonProgress.times_completed).where(
            UserLessonProgress.user_id == user_id
        )
    )
    return {lesson_id: times for lesson_id, times in rows}


def get_or_create_lesson_progress(db: Session, user_id: int, lesson_id: int) -> UserLessonProgress:
    row = db.scalar(
        select(UserLessonProgress).where(
            UserLessonProgress.user_id == user_id, UserLessonProgress.lesson_id == lesson_id
        )
    )
    if row is None:
        row = UserLessonProgress(user_id=user_id, lesson_id=lesson_id, times_completed=0)
        db.add(row)
    return row


def get_or_create_skill_progress(db: Session, user_id: int, skill_id: int) -> UserSkillProgress:
    row = db.scalar(
        select(UserSkillProgress).where(
            UserSkillProgress.user_id == user_id, UserSkillProgress.skill_id == skill_id
        )
    )
    if row is None:
        row = UserSkillProgress(user_id=user_id, skill_id=skill_id, xp=0)
        db.add(row)
    return row


def skill_xp_map(db: Session, user_id: int) -> dict[int, int]:
    rows = db.execute(select(UserSkillProgress.skill_id, UserSkillProgress.xp).where(UserSkillProgress.user_id == user_id))
    return dict(rows.all())


# ------------------------------------------------------------------ attempts
def get_attempt(db: Session, attempt_id: int) -> LessonAttempt | None:
    stmt = (
        select(LessonAttempt)
        .where(LessonAttempt.id == attempt_id)
        .options(
            selectinload(LessonAttempt.items).selectinload(AttemptExercise.exercise),
            selectinload(LessonAttempt.answers),
        )
    )
    return db.scalars(stmt).first()


def open_lesson_attempt(db: Session, user_id: int, lesson_id: int) -> LessonAttempt | None:
    stmt = (
        select(LessonAttempt)
        .where(
            LessonAttempt.user_id == user_id,
            LessonAttempt.lesson_id == lesson_id,
            LessonAttempt.status == "in_progress",
        )
        .order_by(LessonAttempt.id.desc())
    )
    return db.scalars(stmt).first()


def open_attempt_lesson_ids(db: Session, user_id: int) -> set[int]:
    stmt = select(LessonAttempt.lesson_id).where(
        LessonAttempt.user_id == user_id,
        LessonAttempt.status == "in_progress",
        LessonAttempt.lesson_id.is_not(None),
    )
    return set(db.scalars(stmt))


def claim_completion(db: Session, attempt_id: int, now: datetime) -> bool:
    """Compare-and-set in_progress → completed. Exactly one concurrent caller
    gets True; every duplicate gets False. This is the idempotency guard."""
    result = db.execute(
        update(LessonAttempt)
        .where(LessonAttempt.id == attempt_id, LessonAttempt.status == "in_progress")
        .values(status="completed", completed_at=now)
    )
    return result.rowcount == 1


def claim_answer_slot(db: Session, attempt_id: int, seen: int) -> bool:
    """Optimistic lock for answering: succeeds only if nobody else has recorded
    an answer since we read the session (answer_count is still `seen`)."""
    result = db.execute(
        update(LessonAttempt)
        .where(LessonAttempt.id == attempt_id, LessonAttempt.status == "in_progress",
               LessonAttempt.answer_count == seen)
        .values(answer_count=seen + 1)
    )
    return result.rowcount == 1


def recent_completed_attempts(db: Session, user_id: int, limit: int) -> list[LessonAttempt]:
    stmt = (
        select(LessonAttempt)
        .where(LessonAttempt.user_id == user_id, LessonAttempt.status == "completed")
        .options(selectinload(LessonAttempt.lesson))
        .order_by(LessonAttempt.completed_at.desc(), LessonAttempt.id.desc())
        .limit(limit)
    )
    return list(db.scalars(stmt))


def count_completed(db: Session, user_id: int, *, kind: str = "lesson", perfect_only: bool = False) -> int:
    stmt = select(func.count(LessonAttempt.id)).where(
        LessonAttempt.user_id == user_id, LessonAttempt.status == "completed", LessonAttempt.kind == kind
    )
    if perfect_only:
        stmt = stmt.where(LessonAttempt.mistakes == 0)
    return db.scalar(stmt) or 0


def count_skills_completed(db: Session, user_id: int) -> int:
    stmt = select(func.count(UserSkillProgress.id)).where(
        UserSkillProgress.user_id == user_id, UserSkillProgress.completed_at.is_not(None)
    )
    return db.scalar(stmt) or 0


def weak_exercise_ids(db: Session, user_id: int, limit: int) -> list[int]:
    """Exercises the learner got wrong more often than right, worst first."""
    wrong = func.sum(case((ExerciseAttempt.is_correct.is_(False), 1), else_=0))
    right = func.sum(case((ExerciseAttempt.is_correct.is_(True), 1), else_=0))
    stmt = (
        select(ExerciseAttempt.exercise_id)
        .where(ExerciseAttempt.user_id == user_id)
        .group_by(ExerciseAttempt.exercise_id)
        .having(wrong > 0, wrong >= right)
        .order_by((wrong - right).desc(), func.max(ExerciseAttempt.id).desc())
        .limit(limit)
    )
    return list(db.scalars(stmt))


# ------------------------------------------------------------------ daily activity
def get_daily(db: Session, user_id: int, day: date) -> DailyActivity | None:
    return db.scalar(
        select(DailyActivity).where(DailyActivity.user_id == user_id, DailyActivity.activity_date == day)
    )


def get_or_create_daily(db: Session, user: User, day: date) -> DailyActivity:
    row = get_daily(db, user.id, day)
    if row is None:
        row = DailyActivity(user_id=user.id, activity_date=day, xp_earned=0, lessons_completed=0,
                            goal_xp=user.daily_goal_xp)
        db.add(row)
    return row


def daily_range(db: Session, user_id: int, start: date, end: date) -> list[DailyActivity]:
    stmt = (
        select(DailyActivity)
        .where(DailyActivity.user_id == user_id, DailyActivity.activity_date.between(start, end))
        .order_by(DailyActivity.activity_date)
    )
    return list(db.scalars(stmt))


# ------------------------------------------------------------------ achievements
def all_achievements(db: Session) -> list[Achievement]:
    return list(db.scalars(select(Achievement).order_by(Achievement.position)))


def user_achievements(db: Session, user_id: int) -> list[UserAchievement]:
    stmt = select(UserAchievement).where(UserAchievement.user_id == user_id).options(
        selectinload(UserAchievement.achievement)
    )
    return list(db.scalars(stmt))


def achievements_for_attempt(db: Session, attempt_id: int) -> list[Achievement]:
    stmt = (
        select(Achievement)
        .join(UserAchievement, UserAchievement.achievement_id == Achievement.id)
        .where(UserAchievement.attempt_id == attempt_id)
        .order_by(Achievement.position)
    )
    return list(db.scalars(stmt))


# ------------------------------------------------------------------ leaderboard
def weekly_xp_ranking(db: Session, start: date, end: date, limit: int) -> list[tuple[User, int]]:
    xp = func.coalesce(func.sum(DailyActivity.xp_earned), 0).label("xp")
    stmt = (
        select(User, xp)
        .join(DailyActivity, (DailyActivity.user_id == User.id) & DailyActivity.activity_date.between(start, end),
              isouter=True)
        .group_by(User.id)
        .order_by(xp.desc(), User.id)
        .limit(limit)
    )
    return [(u, int(x)) for u, x in db.execute(stmt).all()]


def all_time_ranking(db: Session, limit: int) -> list[tuple[User, int]]:
    stmt = select(User).order_by(User.total_xp.desc(), User.id).limit(limit)
    return [(u, u.total_xp) for u in db.scalars(stmt)]


def weekly_xp_for_user(db: Session, user_id: int, start: date, end: date) -> int:
    stmt = select(func.coalesce(func.sum(DailyActivity.xp_earned), 0)).where(
        DailyActivity.user_id == user_id, DailyActivity.activity_date.between(start, end)
    )
    return int(db.scalar(stmt) or 0)
