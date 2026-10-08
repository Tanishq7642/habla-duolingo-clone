"""Streak rules as pure functions over learner-local calendar dates.

Stored state is (current, longest, last_active_date). Two operations:

* apply_activity – a qualifying activity (lesson/practice completed) happened
  on `today`; returns the new state.
* effective_streak – what to *display* on `today`. A streak broken by a missed
  day is only rewritten in the DB on the next activity, so reads must not trust
  `current` blindly.
"""

from dataclasses import dataclass, replace
from datetime import date, timedelta


@dataclass(frozen=True)
class StreakState:
    current: int
    longest: int
    last_active_date: date | None


def apply_activity(state: StreakState, today: date) -> StreakState:
    last = state.last_active_date
    if last is not None and last >= today:
        # Already counted today. (`last > today` happens if the learner moved
        # west across timezones; never punish or double-count that.)
        return state
    if last == today - timedelta(days=1):
        current = state.current + 1
    else:
        current = 1  # first activity ever, or at least one missed day
    return replace(state, current=current, longest=max(state.longest, current), last_active_date=today)


def effective_streak(state: StreakState, today: date) -> int:
    last = state.last_active_date
    if last is None:
        return 0
    if last >= today - timedelta(days=1):
        return state.current
    return 0


def extended_today(state: StreakState, today: date) -> bool:
    return state.last_active_date is not None and state.last_active_date >= today
