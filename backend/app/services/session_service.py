"""Lesson / practice sessions: the server side of the lesson engine.

The server owns the session queue. `next_exercise_id` is derived from the
answers recorded so far (first every unseen exercise in order, then the missed
ones, least-recently-missed first), so:
  * a refresh resumes exactly where the learner was,
  * a client can't skip exercises or answer one twice,
  * completion can be verified ("every exercise answered correctly").
"""

from datetime import datetime

from sqlalchemy import update
from sqlalchemy.orm import Session

from app.core.clock import local_today
from app.core.config import GameRules
from app.core.errors import Conflict, Forbidden, NotFound
from app.models import AttemptExercise, ExerciseAttempt, LessonAttempt, User
from app.repositories import content as content_repo
from app.repositories import progress as progress_repo
from app.schemas.session import (
    AnswerOut,
    CompletionOut,
    ExerciseOut,
    GoalChange,
    LevelChange,
    ProgressOut,
    ReviewItemOut,
    ReviewOut,
    SessionOut,
    SkillChange,
    SkillRef,
    StreakChange,
    XpBreakdown,
)
from app.services import achievement_service, path_service
from app.services.exercises import answer_text, get_handler, solution_text
from app.services.learner_service import streak_state
from app.services.rewards import level_for_xp, session_reward
from app.services.streak import apply_activity


# ------------------------------------------------------------------ queue logic
def solved_ids(attempt: LessonAttempt) -> set[int]:
    return {a.exercise_id for a in attempt.answers if a.is_correct}


def next_exercise_id(attempt: LessonAttempt) -> int | None:
    seen = {a.exercise_id for a in attempt.answers}
    for item in attempt.items:
        if item.exercise_id not in seen:
            return item.exercise_id
    solved = solved_ids(attempt)
    last_miss: dict[int, int] = {}
    for a in attempt.answers:
        if not a.is_correct:
            last_miss[a.exercise_id] = a.id
    pending = [eid for eid in last_miss if eid not in solved]
    return min(pending, key=last_miss.__getitem__) if pending else None


def progress_of(attempt: LessonAttempt) -> ProgressOut:
    return ProgressOut(completed=len(solved_ids(attempt)), total=len(attempt.items))


# ------------------------------------------------------------------ helpers
def load_owned_attempt(db: Session, user: User, attempt_id: int) -> LessonAttempt:
    attempt = progress_repo.get_attempt(db, attempt_id)
    # Someone else's attempt is reported as missing, not forbidden: don't leak ids.
    if attempt is None or attempt.user_id != user.id:
        raise NotFound("That lesson session doesn't exist.", code="attempt_not_found")
    return attempt


def session_view(db: Session, user: User, attempt: LessonAttempt, *, resumed: bool) -> SessionOut:
    if attempt.lesson is not None:
        title = attempt.lesson.title
        skill = attempt.lesson.skill
        subtitle = f"{skill.icon} {skill.title} · Lesson {attempt.lesson.position}"
    else:
        title, subtitle = "Practice", "💪 Your weak spots"
    return SessionOut(
        attempt_id=attempt.id,
        kind=attempt.kind,
        status=attempt.status,
        lesson_id=attempt.lesson_id,
        title=title,
        subtitle=subtitle,
        exercises=[
            ExerciseOut(id=i.exercise.id, type=i.exercise.type, prompt=i.exercise.prompt,
                        data=i.exercise.data, xp=i.exercise.xp)
            for i in attempt.items
        ],
        next_exercise_id=next_exercise_id(attempt),
        progress=progress_of(attempt),
        mistakes=attempt.mistakes,
        hearts=user.hearts,
        resumed=resumed,
    )


def create_session(db: Session, user: User, *, kind: str, lesson_id: int | None,
                   exercise_ids: list[int]) -> LessonAttempt:
    attempt = LessonAttempt(user_id=user.id, lesson_id=lesson_id, kind=kind, status="in_progress")
    attempt.items = [AttemptExercise(exercise_id=eid, position=i) for i, eid in enumerate(exercise_ids)]
    db.add(attempt)
    db.commit()
    return progress_repo.get_attempt(db, attempt.id)


# ------------------------------------------------------------------ use cases
def start_lesson(db: Session, user: User, lesson_id: int, rules: GameRules) -> SessionOut:
    lesson = content_repo.get_lesson(db, lesson_id)
    if lesson is None:
        raise NotFound("That lesson doesn't exist.", code="lesson_not_found")
    course = path_service.active_course(db, user)
    skill = path_service.find_skill_for_lesson(course, lesson_id)
    if skill is None:
        raise NotFound("That lesson isn't part of your course.", code="lesson_not_found")
    state = path_service.path_state(db, user, course, rules)[skill.id]
    if state.lesson_status[lesson_id] == "locked":
        raise Forbidden("Finish the previous lessons to unlock this one.", code="lesson_locked")

    existing = progress_repo.open_lesson_attempt(db, user.id, lesson_id)
    if existing is not None:
        return session_view(db, user, progress_repo.get_attempt(db, existing.id), resumed=True)

    if user.hearts <= 0:
        raise Forbidden("You're out of hearts. Practice or refill to keep learning.", code="out_of_hearts")
    exercises = content_repo.lesson_exercises(db, lesson_id)
    if not exercises:
        raise Conflict("This lesson has no exercises yet.", code="lesson_empty")
    attempt = create_session(db, user, kind="lesson", lesson_id=lesson_id, exercise_ids=[e.id for e in exercises])
    return session_view(db, user, attempt, resumed=False)


def get_session(db: Session, user: User, attempt_id: int) -> SessionOut:
    attempt = load_owned_attempt(db, user, attempt_id)
    return session_view(db, user, attempt, resumed=True)


def submit_answer(db: Session, user: User, attempt_id: int, exercise_id: int, raw_answer: dict) -> AnswerOut:
    attempt = load_owned_attempt(db, user, attempt_id)
    if attempt.status != "in_progress":
        raise Conflict("This session is already finished.", code="attempt_closed")
    item = next((i for i in attempt.items if i.exercise_id == exercise_id), None)
    if item is None:
        raise NotFound("That exercise isn't part of this session.", code="exercise_not_found")
    if exercise_id != next_exercise_id(attempt):
        raise Conflict("That exercise isn't the current one. Reload to continue.", code="out_of_order")
    is_lesson = attempt.kind == "lesson"
    if is_lesson and user.hearts <= 0:
        raise Forbidden("You're out of hearts.", code="out_of_hearts")

    exercise = item.exercise
    handler = get_handler(exercise.type)
    result, clean_answer = handler.evaluate(exercise.data, exercise.solution, raw_answer)

    attempt.answers.append(ExerciseAttempt(
        attempt_id=attempt.id, exercise_id=exercise.id, user_id=user.id,
        submitted=clean_answer, is_correct=result.correct,
    ))
    if not result.correct:
        attempt.mistakes += 1
        if is_lesson:
            # Atomic, floor-guarded decrement: concurrent wrong answers can't
            # push hearts below zero or lose an update.
            db.execute(update(User).where(User.id == user.id, User.hearts > 0)
                       .values(hearts=User.hearts - 1))
    db.commit()
    db.refresh(user)

    return AnswerOut(
        correct=result.correct,
        correct_answer=result.correct_answer,
        note=result.note,
        explanation=exercise.explanation,
        detail=result.detail,
        xp_earned=exercise.xp if result.correct else 0,  # provisional; credited on completion
        hearts_remaining=user.hearts,
        out_of_hearts=is_lesson and user.hearts == 0,
        requeued=not result.correct,
        progress=progress_of(attempt),
        next_exercise_id=next_exercise_id(attempt),
    )


def complete(db: Session, user: User, attempt_id: int, now: datetime, rules: GameRules) -> CompletionOut:
    """Award everything for a finished session in ONE transaction.

    Idempotency: `claim_completion` is a compare-and-set on the attempt's
    status. The first request flips it and applies rewards; any duplicate
    (double click, retry after a timeout, concurrent tab) sees it already
    completed and gets the stored receipt with `already_completed=True`.
    """
    attempt = load_owned_attempt(db, user, attempt_id)
    if attempt.status == "completed":
        return _completion_view(db, user, attempt, now, rules, already_completed=True)
    if attempt.status != "in_progress":
        raise Conflict("This session was ended and can't be completed.", code="attempt_closed")
    if next_exercise_id(attempt) is not None:
        raise Conflict("Answer every exercise correctly before finishing.", code="session_incomplete")

    if not progress_repo.claim_completion(db, attempt.id, now):
        db.rollback()  # lost the race to a concurrent request
        db.refresh(attempt)
        return _completion_view(db, user, attempt, now, rules, already_completed=True)

    try:
        changes = _apply_rewards(db, user, attempt, now, rules)
        db.commit()
    except Exception:
        db.rollback()  # status flip and every reward roll back together
        raise
    return _completion_view(db, user, attempt, now, rules, already_completed=False, **changes)


def _apply_rewards(db: Session, user: User, attempt: LessonAttempt, now: datetime, rules: GameRules) -> dict:
    reward = session_reward(attempt.kind, [i.exercise.xp for i in attempt.items], attempt.mistakes, rules)
    attempt.xp_awarded = reward.total_xp
    attempt.bonus_xp = reward.bonus_xp
    attempt.gems_awarded = reward.gems
    attempt.hearts_awarded = reward.hearts

    level_before = level_for_xp(user.total_xp).level
    user.total_xp += reward.total_xp
    user.gems += reward.gems
    user.hearts = min(rules.max_hearts, user.hearts + reward.hearts)

    today = local_today(now, user.timezone)
    daily = progress_repo.get_or_create_daily(db, user, today)
    goal_was_reached = daily.xp_earned >= daily.goal_xp
    daily.xp_earned += reward.total_xp
    daily.lessons_completed += 1

    before = streak_state(user)
    after = apply_activity(before, today)
    user.current_streak, user.longest_streak, user.last_active_date = after.current, after.longest, after.last_active_date

    skill_just_completed = False
    if attempt.kind == "lesson" and attempt.lesson_id is not None:
        lp = progress_repo.get_or_create_lesson_progress(db, user.id, attempt.lesson_id)
        lp.times_completed += 1
        lp.first_completed_at = lp.first_completed_at or now
        lp.last_completed_at = now

        skill = attempt.lesson.skill
        sp = progress_repo.get_or_create_skill_progress(db, user.id, skill.id)
        sp.xp += reward.total_xp
        if sp.completed_at is None:
            db.flush()
            completions = progress_repo.lesson_completions(db, user.id)
            if all(completions.get(l.id, 0) > 0 for l in skill.lessons):
                sp.completed_at = now
                skill_just_completed = True

    achievement_service.evaluate(db, user, now, attempt.id)
    return {
        "streak_extended": after != before,
        "goal_just_reached": not goal_was_reached and daily.xp_earned >= daily.goal_xp,
        "skill_just_completed": skill_just_completed,
        "leveled_up": level_for_xp(user.total_xp).level > level_before,
    }


def _completion_view(db: Session, user: User, attempt: LessonAttempt, now: datetime, rules: GameRules, *,
                     already_completed: bool, streak_extended: bool = False, goal_just_reached: bool = False,
                     skill_just_completed: bool = False, leveled_up: bool = False) -> CompletionOut:
    today = local_today(now, user.timezone)
    daily = progress_repo.get_daily(db, user.id, today)
    xp_today = daily.xp_earned if daily else 0
    lvl = level_for_xp(user.total_xp)

    skill_change = unlocked = None
    if attempt.lesson is not None:
        course = path_service.active_course(db, user)
        skill = attempt.lesson.skill
        states = path_service.path_state(db, user, course, rules)
        st = states[skill.id]
        skill_change = SkillChange(
            id=skill.id, title=skill.title, icon=skill.icon,
            lessons_completed=st.lessons_completed, lessons_total=st.lessons_total,
            mastery=st.mastery, mastery_cap=rules.mastery_cap,
            completed=st.status == "completed", just_completed=skill_just_completed,
        )
        nxt = path_service.skill_after(course, skill.id)
        if skill_just_completed and nxt is not None:
            unlocked = SkillRef(id=nxt.id, title=nxt.title, icon=nxt.icon)

    unlocked_achievements = progress_repo.achievements_for_attempt(db, attempt.id)
    return CompletionOut(
        attempt_id=attempt.id,
        kind=attempt.kind,
        already_completed=already_completed,
        xp=XpBreakdown(base=attempt.xp_awarded - attempt.bonus_xp, bonus=attempt.bonus_xp, total=attempt.xp_awarded),
        gems_awarded=attempt.gems_awarded,
        hearts_awarded=attempt.hearts_awarded,
        hearts=user.hearts,
        mistakes=attempt.mistakes,
        perfect=attempt.mistakes == 0,
        streak=StreakChange(current=user.current_streak, longest=user.longest_streak, extended=streak_extended),
        daily_goal=GoalChange(goal_xp=user.daily_goal_xp, xp_today=xp_today,
                              reached=xp_today >= user.daily_goal_xp, just_reached=goal_just_reached),
        level=LevelChange(level=lvl.level, xp_into_level=lvl.xp_into_level,
                          xp_for_next_level=lvl.xp_for_next_level, leveled_up=leveled_up),
        skill=skill_change,
        unlocked_skill=unlocked,
        achievements=achievement_service.to_out(unlocked_achievements, attempt.completed_at),
    )


def abandon(db: Session, user: User, attempt_id: int) -> SessionOut:
    attempt = load_owned_attempt(db, user, attempt_id)
    if attempt.status == "in_progress":
        attempt.status = "failed" if attempt.kind == "lesson" and user.hearts == 0 else "abandoned"
        db.commit()
    return session_view(db, user, attempt, resumed=False)


def review(db: Session, user: User, attempt_id: int) -> ReviewOut:
    attempt = load_owned_attempt(db, user, attempt_id)
    if attempt.status == "in_progress":
        # Reviewing mid-session would reveal answers to pending exercises.
        raise Conflict("Finish the session before reviewing mistakes.", code="attempt_in_progress")
    missed: dict[int, list[ExerciseAttempt]] = {}
    for a in attempt.answers:
        if not a.is_correct:
            missed.setdefault(a.exercise_id, []).append(a)
    items = []
    for item in attempt.items:
        wrong = missed.get(item.exercise_id)
        if not wrong:
            continue
        ex = item.exercise
        handler = get_handler(ex.type)
        items.append(ReviewItemOut(
            exercise_id=ex.id, type=ex.type, prompt=ex.prompt,
            your_answer=answer_text(handler, ex.data, wrong[0].submitted),
            correct_answer=solution_text(handler, ex.data, ex.solution),
            explanation=ex.explanation, times_missed=len(wrong),
        ))
    return ReviewOut(attempt_id=attempt.id, items=items)
