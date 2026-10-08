"""Demo tools: simulate the passage of time and reset demo data.

The assignment asks for streak/day logic that is "simulated/testable". Rather
than faking the server clock, time travel moves the learner's *history* back
by N days. To the streak and daily-goal rules that is indistinguishable from
N days passing, and it exercises exactly the same production code paths.

Disabled with HABLA_ENABLE_DEV_TOOLS=false.
"""

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.core.config import GameRules
from app.models import DailyActivity, User
from app.schemas.learner import LearnerOut
from app.services import learner_service


def time_travel(db: Session, user: User, days: int, now: datetime, rules: GameRules) -> LearnerOut:
    shift = timedelta(days=days)
    if user.last_active_date is not None:
        user.last_active_date -= shift
    # Oldest first: each row moves into a date that is already free, so the
    # UNIQUE(user_id, activity_date) constraint is never violated mid-update.
    rows = db.scalars(
        select(DailyActivity).where(DailyActivity.user_id == user.id).order_by(DailyActivity.activity_date)
    )
    for row in rows:
        row.activity_date -= shift
        db.flush()
    db.commit()
    return learner_service.learner_view(db, user, now, rules)


def reset_demo(engine: Engine) -> None:
    from app.seed import seed  # local import: seeding pulls in the whole content module

    seed.run(engine)
