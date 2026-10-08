from typing import Any

from pydantic import BaseModel, Field

from app.schemas.learner import AchievementOut, LevelOut


class ExerciseOut(BaseModel):
    """Public view of an exercise. Intentionally has no solution field."""

    id: int
    type: str
    prompt: str
    data: dict[str, Any]
    xp: int


class ProgressOut(BaseModel):
    completed: int
    total: int


class SessionOut(BaseModel):
    attempt_id: int
    kind: str  # lesson | practice
    status: str
    lesson_id: int | None
    title: str
    subtitle: str
    exercises: list[ExerciseOut]
    next_exercise_id: int | None
    progress: ProgressOut
    mistakes: int
    hearts: int
    resumed: bool


class AnswerIn(BaseModel):
    exercise_id: int = Field(gt=0)
    answer: dict[str, Any]


class SkipIn(BaseModel):
    exercise_id: int = Field(gt=0)


class AnswerOut(BaseModel):
    correct: bool
    correct_answer: str
    note: str | None
    explanation: str
    detail: dict[str, Any] | None
    xp_earned: int
    hearts_remaining: int
    out_of_hearts: bool
    requeued: bool
    progress: ProgressOut
    next_exercise_id: int | None


class XpBreakdown(BaseModel):
    base: int
    bonus: int
    total: int


class StreakChange(BaseModel):
    current: int
    longest: int
    extended: bool  # this session extended the streak (first activity today)


class GoalChange(BaseModel):
    goal_xp: int
    xp_today: int
    reached: bool
    just_reached: bool


class SkillChange(BaseModel):
    id: int
    title: str
    icon: str
    lessons_completed: int
    lessons_total: int
    mastery: int
    mastery_cap: int
    completed: bool
    just_completed: bool


class SkillRef(BaseModel):
    id: int
    title: str
    icon: str


class LevelChange(LevelOut):
    leveled_up: bool


class CompletionOut(BaseModel):
    attempt_id: int
    kind: str
    already_completed: bool
    xp: XpBreakdown
    gems_awarded: int
    hearts_awarded: int
    hearts: int
    mistakes: int
    perfect: bool
    accuracy: int  # % of answers that were right (exercises / (exercises + misses))
    duration_seconds: int  # start → finish, for the "SPEEDY / COMMITTED" tile
    streak: StreakChange
    daily_goal: GoalChange
    level: LevelChange
    skill: SkillChange | None
    unlocked_skill: SkillRef | None
    achievements: list[AchievementOut]


class ReviewItemOut(BaseModel):
    exercise_id: int
    type: str
    prompt: str
    your_answer: str
    correct_answer: str
    explanation: str
    times_missed: int


class ReviewOut(BaseModel):
    attempt_id: int
    items: list[ReviewItemOut]


class PracticeSummaryOut(BaseModel):
    weak_exercises: int
    available: bool
    reason: str | None
