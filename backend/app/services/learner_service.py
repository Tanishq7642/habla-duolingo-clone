"""Learner HUD, profile stats, activity, settings and the heart wallet."""

from datetime import datetime, timedelta

from sqlalchemy import update
from sqlalchemy.orm import Session

from app.core.clock import is_valid_timezone, local_today
from app.core.config import GameRules
from app.core.errors import Conflict, DomainError, PaymentRequired
from app.models import User
from app.repositories import content as content_repo
from app.repositories import progress as progress_repo
from app.schemas.learner import (
    ActivityOut,
    DailyGoalOut,
    DayActivityOut,
    HeartsOut,
    LearnerOut,
    LevelOut,
    MomentumOut,
    RecentSessionOut,
    SettingsIn,
    StatsOut,
    StreakOut,
)
from app.services import achievement_service, path_service
from app.services.rewards import level_for_xp
from app.services.streak import StreakState, effective_streak, extended_today

MOMENTUM_WINDOW_DAYS = 7
RECENT_SESSIONS = 5


def streak_state(user: User) -> StreakState:
    return StreakState(user.current_streak, user.longest_streak, user.last_active_date)


def learner_view(db: Session, user: User, now: datetime, rules: GameRules) -> LearnerOut:
    today = local_today(now, user.timezone)
    state = streak_state(user)
    current = effective_streak(state, today)
    done_today = extended_today(state, today)

    daily = progress_repo.get_daily(db, user.id, today)
    xp_today = daily.xp_earned if daily else 0
    window = progress_repo.daily_range(db, user.id, today - timedelta(days=MOMENTUM_WINDOW_DAYS - 1), today)

    course = None
    if user.active_course_id is not None:
        header = content_repo.get_course_header(db, user.active_course_id)  # 1 query, not the whole tree
        course = path_service.course_ref(header) if header else None

    lvl = level_for_xp(user.total_xp)
    return LearnerOut(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        avatar_color=user.avatar_color,
        timezone=user.timezone,
        hearts=user.hearts,
        max_hearts=rules.max_hearts,
        gems=user.gems,
        heart_refill_cost=rules.heart_refill_cost_gems,
        total_xp=user.total_xp,
        level=LevelOut(**lvl.__dict__),
        streak=StreakOut(
            current=current,
            longest=user.longest_streak,
            extended_today=done_today,
            at_risk=current > 0 and not done_today,
        ),
        daily_goal=DailyGoalOut(goal_xp=user.daily_goal_xp, xp_today=xp_today,
                                reached=xp_today >= user.daily_goal_xp),
        momentum=MomentumOut(active_days=sum(1 for d in window if d.xp_earned > 0),
                             window_days=MOMENTUM_WINDOW_DAYS),
        course=course,
        joined_at=user.created_at,
    )


def stats(db: Session, user: User, now: datetime, rules: GameRules) -> StatsOut:
    course = path_service.active_course(db, user)
    return StatsOut(
        learner=learner_view(db, user, now, rules),
        lessons_completed=progress_repo.count_completed(db, user.id),
        perfect_lessons=progress_repo.count_completed(db, user.id, perfect_only=True),
        practice_sessions=progress_repo.count_completed(db, user.id, kind="practice"),
        skills_completed=progress_repo.count_skills_completed(db, user.id),
        skills_total=len(path_service.ordered_skills(course)),
        achievements=achievement_service.list_for_user(db, user),
    )


def activity(db: Session, user: User, now: datetime) -> ActivityOut:
    today = local_today(now, user.timezone)
    start = today - timedelta(days=MOMENTUM_WINDOW_DAYS - 1)
    rows = {d.activity_date: d for d in progress_repo.daily_range(db, user.id, start, today)}
    days = []
    for offset in range(MOMENTUM_WINDOW_DAYS):
        day = start + timedelta(days=offset)
        row = rows.get(day)
        days.append(DayActivityOut(
            date=day,
            xp=row.xp_earned if row else 0,
            goal_xp=row.goal_xp if row else user.daily_goal_xp,
            lessons=row.lessons_completed if row else 0,
        ))
    recent = [
        RecentSessionOut(
            attempt_id=a.id,
            kind=a.kind,
            title=a.lesson.title if a.lesson else "Practice session",
            xp=a.xp_awarded,
            mistakes=a.mistakes,
            completed_at=a.completed_at,
        )
        for a in progress_repo.recent_completed_attempts(db, user.id, RECENT_SESSIONS)
    ]
    return ActivityOut(days=days, recent=recent)


def update_settings(db: Session, user: User, payload: SettingsIn, now: datetime, rules: GameRules) -> LearnerOut:
    if payload.daily_goal_xp is not None:
        if payload.daily_goal_xp not in rules.allowed_daily_goals:
            raise DomainError(f"Daily goal must be one of {list(rules.allowed_daily_goals)}.",
                              code="invalid_daily_goal")
        user.daily_goal_xp = payload.daily_goal_xp
        # Today's row keeps a snapshot of the goal so history stays truthful,
        # but changing the goal mid-day should apply to today.
        today_row = progress_repo.get_daily(db, user.id, local_today(now, user.timezone))
        if today_row:
            today_row.goal_xp = payload.daily_goal_xp
    if payload.timezone is not None:
        if not is_valid_timezone(payload.timezone):
            raise DomainError("Unknown timezone.", code="invalid_timezone")
        user.timezone = payload.timezone
    if payload.display_name is not None:
        user.display_name = payload.display_name.strip()
    db.commit()
    return learner_view(db, user, now, rules)


def refill_hearts(db: Session, user: User, rules: GameRules) -> HeartsOut:
    cost = rules.heart_refill_cost_gems
    # Check-and-charge in ONE conditional UPDATE, so parallel refills can't
    # both pass the checks and double-charge (or lose an update).
    charged = db.execute(
        update(User)
        .where(User.id == user.id, User.hearts < rules.max_hearts, User.gems >= cost)
        .values(gems=User.gems - cost, hearts=rules.max_hearts)
    ).rowcount == 1
    db.commit()
    db.refresh(user)
    if not charged:
        if user.hearts >= rules.max_hearts:
            raise Conflict("Your hearts are already full.", code="hearts_full")
        raise PaymentRequired(f"You need {cost} gems to refill hearts.")
    return HeartsOut(hearts=user.hearts, max_hearts=rules.max_hearts, gems=user.gems)
