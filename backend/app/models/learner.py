"""Per-learner state: identity, wallet counters, sessions, progress, activity."""

from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.content import Exercise, Lesson


class User(TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("hearts >= 0", name="ck_users_hearts_nonneg"),
        CheckConstraint("gems >= 0", name="ck_users_gems_nonneg"),
        Index("ix_users_total_xp", "total_xp"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(32), unique=True)
    display_name: Mapped[str] = mapped_column(String(64))
    avatar_color: Mapped[str] = mapped_column(String(16), default="#3DBE5B")
    is_bot: Mapped[bool] = mapped_column(Boolean, default=False)  # seeded rival
    timezone: Mapped[str] = mapped_column(String(64), default="UTC")
    active_course_id: Mapped[int | None] = mapped_column(ForeignKey("courses.id"))

    # Counters mutated only inside service transactions.
    hearts: Mapped[int] = mapped_column(Integer, default=5)
    gems: Mapped[int] = mapped_column(Integer, default=0)
    total_xp: Mapped[int] = mapped_column(Integer, default=0)
    daily_goal_xp: Mapped[int] = mapped_column(Integer, default=20)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_active_date: Mapped[date | None] = mapped_column(Date)


class LessonAttempt(TimestampMixin, Base):
    """A play session (a lesson run or a practice run).

    It is also the idempotency key for rewards: completion flips status from
    `in_progress` to `completed` with a compare-and-set, so a duplicate
    completion request can't award XP twice.
    """

    __tablename__ = "lesson_attempts"
    __table_args__ = (
        Index("ix_attempts_user_status", "user_id", "status"),
        Index("ix_attempts_user_lesson", "user_id", "lesson_id"),
        # At most one *open* session per learner per lesson (partial unique index),
        # so two parallel "start" requests can't create two sessions.
        Index(
            "uq_attempts_one_open_per_lesson",
            "user_id",
            "lesson_id",
            unique=True,
            sqlite_where=text("status = 'in_progress' AND lesson_id IS NOT NULL"),
            postgresql_where=text("status = 'in_progress' AND lesson_id IS NOT NULL"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    lesson_id: Mapped[int | None] = mapped_column(ForeignKey("lessons.id"))  # null for practice
    kind: Mapped[str] = mapped_column(String(16), default="lesson")  # lesson | practice
    status: Mapped[str] = mapped_column(String(16), default="in_progress")
    # Optimistic-concurrency version: number of answers accepted so far. Each
    # answer must claim slot N -> N+1, so duplicate parallel submissions lose.
    answer_count: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Reward receipt, written once at completion and replayed on duplicates.
    xp_awarded: Mapped[int] = mapped_column(Integer, default=0)
    bonus_xp: Mapped[int] = mapped_column(Integer, default=0)
    gems_awarded: Mapped[int] = mapped_column(Integer, default=0)
    hearts_awarded: Mapped[int] = mapped_column(Integer, default=0)
    mistakes: Mapped[int] = mapped_column(Integer, default=0)

    lesson: Mapped[Lesson | None] = relationship()
    items: Mapped[list["AttemptExercise"]] = relationship(
        order_by="AttemptExercise.position", cascade="all, delete-orphan"
    )
    answers: Mapped[list["ExerciseAttempt"]] = relationship(
        order_by="ExerciseAttempt.id", cascade="all, delete-orphan"
    )


class AttemptExercise(Base):
    """The ordered exercise set a session consists of."""

    __tablename__ = "attempt_exercises"
    __table_args__ = (UniqueConstraint("attempt_id", "exercise_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    attempt_id: Mapped[int] = mapped_column(ForeignKey("lesson_attempts.id", ondelete="CASCADE"))
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"))
    position: Mapped[int] = mapped_column(Integer)

    exercise: Mapped[Exercise] = relationship()


class ExerciseAttempt(TimestampMixin, Base):
    """One submitted answer. Append-only history."""

    __tablename__ = "exercise_attempts"
    __table_args__ = (
        Index("ix_exattempts_attempt_exercise", "attempt_id", "exercise_id"),
        Index("ix_exattempts_user_correct", "user_id", "is_correct"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    attempt_id: Mapped[int] = mapped_column(ForeignKey("lesson_attempts.id", ondelete="CASCADE"))
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    submitted: Mapped[dict[str, Any]] = mapped_column(JSON)
    is_correct: Mapped[bool] = mapped_column(Boolean)

    exercise: Mapped[Exercise] = relationship()


class UserLessonProgress(Base):
    __tablename__ = "user_lesson_progress"
    __table_args__ = (UniqueConstraint("user_id", "lesson_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"))
    times_completed: Mapped[int] = mapped_column(Integer, default=0)
    first_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class UserSkillProgress(Base):
    __tablename__ = "user_skill_progress"
    __table_args__ = (UniqueConstraint("user_id", "skill_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"))
    xp: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class DailyActivity(Base):
    """One row per learner per *local* calendar day."""

    __tablename__ = "daily_activity"
    __table_args__ = (
        UniqueConstraint("user_id", "activity_date"),
        Index("ix_daily_activity_date", "activity_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    activity_date: Mapped[date] = mapped_column(Date)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    lessons_completed: Mapped[int] = mapped_column(Integer, default=0)
    goal_xp: Mapped[int] = mapped_column(Integer, default=20)  # goal in force that day


class Achievement(Base):
    """Data-driven achievement: unlocked when `metric` reaches `threshold`."""

    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(48), unique=True)
    title: Mapped[str] = mapped_column(String(64))
    description: Mapped[str] = mapped_column(String(160))
    icon: Mapped[str] = mapped_column(String(16))
    metric: Mapped[str] = mapped_column(String(32))
    threshold: Mapped[int] = mapped_column(Integer)
    position: Mapped[int] = mapped_column(Integer, default=0)


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    achievement_id: Mapped[int] = mapped_column(ForeignKey("achievements.id", ondelete="CASCADE"))
    unlocked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    attempt_id: Mapped[int | None] = mapped_column(ForeignKey("lesson_attempts.id"))

    achievement: Mapped[Achievement] = relationship()
