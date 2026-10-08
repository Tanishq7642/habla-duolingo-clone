"""Leaderboard computed from real learner data.

Weekly = XP summed from `daily_activity` over the last 7 local days; all-time
= `users.total_xp`. Seeded rivals are ordinary user rows, so nothing changes
when real users join. At scale this query would move to a materialised table
or a Redis sorted set updated on lesson completion.
"""

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.core.clock import local_today
from app.core.config import GameRules
from app.models import User
from app.repositories import progress as progress_repo
from app.schemas.leaderboard import LeaderboardEntryOut, LeaderboardOut

WEEK_DAYS = 7


def _entry(rank: int, user: User, xp: int, me: User) -> LeaderboardEntryOut:
    return LeaderboardEntryOut(rank=rank, user_id=user.id, username=user.username,
                               display_name=user.display_name, avatar_color=user.avatar_color,
                               xp=xp, is_me=user.id == me.id)


def leaderboard(db: Session, me: User, period: str, now: datetime, rules: GameRules) -> LeaderboardOut:
    limit = rules.leaderboard_size
    if period == "week":
        end = local_today(now, me.timezone)
        start = end - timedelta(days=WEEK_DAYS - 1)
        rows = progress_repo.weekly_xp_ranking(db, start, end, limit)
        label = f"{start:%b %d} – {end:%b %d}"
    else:
        rows = progress_repo.all_time_ranking(db, limit)
        label = "All time"

    entries = [_entry(i + 1, u, xp, me) for i, (u, xp) in enumerate(rows)]
    me_entry = None
    if not any(e.is_me for e in entries):
        my_xp = progress_repo.weekly_xp_for_user(db, me.id, start, end) if period == "week" else me.total_xp
        me_entry = _entry(0, me, my_xp, me)  # rank 0 = "outside the top list"
    return LeaderboardOut(period=period, window_label=label, entries=entries, me=me_entry)
