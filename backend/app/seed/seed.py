"""Reset and seed the database.

    python -m app.seed.seed

Content is validated through the exercise handler registry, so a typo in a
solution fails here instead of in front of a learner. The demo learner's
history is produced by *replaying real sessions through the service layer*
on past dates, so seeded XP, streak, daily activity, unlocks and achievements
obey exactly the same rules as live play.
"""

import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import Engine, func, inspect, select, text
from sqlalchemy.orm import Session

from app.core.config import GameRules, get_settings
from app.db.base import Base
from app.models import (
    Achievement,
    Course,
    DailyActivity,
    Exercise,
    Language,
    Lesson,
    Skill,
    Unit,
    User,
)
from app.seed.course_spanish import ACHIEVEMENTS, COURSE
from app.services import session_service
from app.services.exercises import get_handler

DEMO_START_GEMS = 500
SEED_LOCK_KEY = 74_210  # arbitrary app-wide id for the seeding advisory lock
DEMO_HEARTS_AFTER_SEED = 4  # simulate partial overnight regeneration

RIVALS = [
    ("lucia", "Lucía M.", "#FF7A59"), ("kenji", "Kenji T.", "#7C5CFF"), ("amara", "Amara O.", "#13B5A6"),
    ("diego", "Diego R.", "#FFB020"), ("sofia", "Sofía L.", "#E64980"), ("noah", "Noah B.", "#2EA6F0"),
    ("priya", "Priya S.", "#8CC152"), ("mateo", "Mateo G.", "#F06543"), ("hana", "Hana K.", "#5C7CFA"),
]

# (days ago, [(skill index, lesson index, positions answered wrong first)])
DEMO_HISTORY = [
    (4, [(0, 0, []), (0, 1, [1])]),
    (3, [(0, 2, [0, 3])]),
    (2, [(1, 0, [2])]),
    (1, [(0, 0, [])]),
]


def _language(db: Session, code: str, name: str, flag: str) -> Language:
    lang = Language(code=code, name=name, flag=flag)
    db.add(lang)
    return lang


def seed_content(db: Session) -> Course:
    learning = _language(db, *COURSE["learning"])
    source = _language(db, *COURSE["from"])
    course = Course(learning_language=learning, from_language=source, title=COURSE["title"])
    for u_pos, u in enumerate(COURSE["units"], start=1):
        unit = Unit(position=u_pos, title=u["title"], description=u["description"], theme=u["theme"])
        for s_pos, s in enumerate(u["skills"], start=1):
            skill = Skill(position=s_pos, title=s["title"], description=s["description"], icon=s["icon"])
            for l_pos, (title, exercises) in enumerate(s["lessons"], start=1):
                lesson = Lesson(position=l_pos, title=title)
                for e_pos, e in enumerate(exercises, start=1):
                    get_handler(e["type"]).validate_content(e["data"], e["solution"])
                    lesson.exercises.append(Exercise(position=e_pos, **e))
                skill.lessons.append(lesson)
            unit.skills.append(skill)
        course.units.append(unit)
    db.add(course)
    for pos, (code, title, desc, icon, metric, threshold) in enumerate(ACHIEVEMENTS):
        db.add(Achievement(code=code, title=title, description=desc, icon=icon, metric=metric,
                           threshold=threshold, position=pos))
    db.flush()
    return course


def seed_rivals(db: Session, course: Course, now: datetime, rng: random.Random) -> None:
    today = now.date()
    for username, name, color in RIVALS:
        user = User(username=username, display_name=name, avatar_color=color, is_bot=True,
                    active_course_id=course.id, gems=rng.randint(100, 900), created_at=now - timedelta(days=90))
        db.add(user)
        db.flush()
        weekly = 0
        intensity = rng.uniform(0.3, 1.0)
        streak = 0
        for days_ago in range(6, -1, -1):
            if rng.random() > intensity:
                streak = 0
                continue
            xp = rng.choice([15, 20, 30, 40, 50, 65])
            weekly += xp
            streak += 1
            db.add(DailyActivity(user_id=user.id, activity_date=today - timedelta(days=days_ago),
                                 xp_earned=xp, lessons_completed=max(1, xp // 20), goal_xp=20))
        user.total_xp = weekly + rng.randint(80, 1600)
        user.current_streak = streak
        user.longest_streak = max(streak, rng.randint(streak, 40))
        user.last_active_date = today if streak else None


def _correct_answer(ex: Exercise) -> dict:
    s, d = ex.solution, ex.data
    if ex.type in ("multiple_choice", "fill_blank"):
        return {"option_id": s["option_id"]}
    if ex.type == "word_bank":
        pool = {t["id"]: t["text"] for t in d["tiles"]}
        ids = []
        for word in s["accepted"][0]:
            tid = next(t for t, w in pool.items() if w == word and t not in ids)
            ids.append(tid)
        return {"tile_ids": ids}
    if ex.type == "match_pairs":
        return {"pairs": s["pairs"]}
    return {"text": s["accepted"][0]}


def _wrong_answer(ex: Exercise) -> dict:
    d = ex.data
    if ex.type in ("multiple_choice", "fill_blank"):
        return {"option_id": next(o["id"] for o in d["options"] if o["id"] != ex.solution["option_id"])}
    if ex.type == "word_bank":
        return {"tile_ids": [t["id"] for t in d["tiles"]]}  # every tile incl. distractors
    if ex.type == "match_pairs":
        rights = list(ex.solution["pairs"].values())
        return {"pairs": dict(zip(ex.solution["pairs"], rights[1:] + rights[:1]))}
    return {"text": "no sé"}


def play_lesson(db: Session, user: User, lesson: Lesson, wrong_positions: list[int], now: datetime,
                rules: GameRules) -> None:
    """Drive a full lesson through the real service layer."""
    session = session_service.start_lesson(db, user, lesson.id, rules)
    exercises = {e.id: e for e in lesson.exercises}
    missed: set[int] = set()
    while session.next_exercise_id is not None:
        ex = exercises[session.next_exercise_id]
        miss = ex.position - 1 in wrong_positions and ex.id not in missed
        if miss:
            missed.add(ex.id)
        result = session_service.submit_answer(db, user, session.attempt_id, ex.id,
                                               _wrong_answer(ex) if miss else _correct_answer(ex))
        session = session.model_copy(update={"next_exercise_id": result.next_exercise_id})
    session_service.complete(db, user, session.attempt_id, now, rules)


def seed_demo(db: Session, course: Course, now: datetime, rules: GameRules) -> User:
    demo = User(username=get_settings().demo_username, display_name="Alex", avatar_color="#58CC02",
                timezone="UTC", active_course_id=course.id, hearts=rules.max_hearts,
                gems=DEMO_START_GEMS, daily_goal_xp=20, created_at=now - timedelta(days=30))
    db.add(demo)
    db.commit()
    skills = [s for u in course.units for s in u.skills]
    for days_ago, sessions in DEMO_HISTORY:
        when = now - timedelta(days=days_ago)
        for skill_idx, lesson_idx, wrong in sessions:
            play_lesson(db, demo, skills[skill_idx].lessons[lesson_idx], wrong, when, rules)
    demo.hearts = DEMO_HEARTS_AFTER_SEED
    db.commit()
    return demo


def run(engine: Engine, now: datetime | None = None) -> None:
    now = now or datetime.now(timezone.utc)
    rules = get_settings().rules
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with Session(engine, expire_on_commit=False) as db:
        course = seed_content(db)
        seed_rivals(db, course, now, random.Random(42))
        db.commit()
        seed_demo(db, course, now, rules)


def ensure_seeded(engine: Engine) -> bool:
    """Seed only if the database has no learners yet. Returns True if it seeded.

    Hosting platforms often start with an empty disk, so the API seeds itself
    on first boot instead of requiring a manual step.
    """
    with engine.connect() as lock_conn:
        # Serverless platforms may boot several instances at once on a fresh
        # database; a Postgres advisory lock lets exactly one of them seed.
        is_pg = engine.dialect.name == "postgresql"
        if is_pg:
            lock_conn.execute(text("SELECT pg_advisory_lock(:k)"), {"k": SEED_LOCK_KEY})
            lock_conn.commit()
        try:
            if inspect(engine).has_table("users"):
                with Session(engine) as db:
                    if db.scalar(select(func.count(User.id))):
                        return False
            run(engine)
            return True
        finally:
            if is_pg:
                lock_conn.execute(text("SELECT pg_advisory_unlock(:k)"), {"k": SEED_LOCK_KEY})
                lock_conn.commit()


def main() -> None:
    from app.db.session import engine

    run(engine)
    print(f"Seeded {engine.url} – demo learner '{get_settings().demo_username}' ready.")


if __name__ == "__main__":
    main()
