from datetime import date, datetime

from pydantic import BaseModel, Field


class LevelOut(BaseModel):
    level: int
    xp_into_level: int
    xp_for_next_level: int


class StreakOut(BaseModel):
    current: int
    longest: int
    extended_today: bool
    at_risk: bool  # active yesterday, not yet today


class DailyGoalOut(BaseModel):
    goal_xp: int
    xp_today: int
    reached: bool


class MomentumOut(BaseModel):
    active_days: int  # out of the last `window_days`
    window_days: int


class CourseRef(BaseModel):
    id: int
    title: str
    language: str
    flag: str


class LearnerOut(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_color: str
    timezone: str
    hearts: int
    max_hearts: int
    gems: int
    heart_refill_cost: int
    total_xp: int
    level: LevelOut
    streak: StreakOut
    daily_goal: DailyGoalOut
    momentum: MomentumOut
    course: CourseRef | None
    joined_at: datetime


class AchievementOut(BaseModel):
    code: str
    title: str
    description: str
    icon: str
    threshold: int
    progress: int
    unlocked_at: datetime | None


class StatsOut(BaseModel):
    learner: LearnerOut
    lessons_completed: int
    perfect_lessons: int
    practice_sessions: int
    skills_completed: int
    skills_total: int
    achievements: list[AchievementOut]


class DayActivityOut(BaseModel):
    date: date
    xp: int
    goal_xp: int
    lessons: int


class RecentSessionOut(BaseModel):
    attempt_id: int
    kind: str
    title: str
    xp: int
    mistakes: int
    completed_at: datetime | None


class ActivityOut(BaseModel):
    days: list[DayActivityOut]
    recent: list[RecentSessionOut]


class SettingsIn(BaseModel):
    daily_goal_xp: int | None = Field(default=None, ge=1, le=500)
    timezone: str | None = Field(default=None, max_length=64)
    display_name: str | None = Field(default=None, min_length=1, max_length=40)


class HeartsOut(BaseModel):
    hearts: int
    max_hearts: int
    gems: int
