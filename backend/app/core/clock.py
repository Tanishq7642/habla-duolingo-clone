"""Time source and learner-local calendar helpers.

Streaks and daily goals are defined on the *learner's* calendar day, not UTC:
a learner in Kolkata finishing a lesson at 00:30 local time has started a new
day even though UTC still says yesterday. All "what day is it" questions go
through `local_today`, and the clock itself is injectable so tests can freeze
or move time without monkeypatching datetime.
"""

from datetime import date, datetime, timezone
from typing import Callable
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

Clock = Callable[[], datetime]


def system_clock() -> datetime:
    return datetime.now(timezone.utc)


def safe_zone(tz_name: str) -> ZoneInfo:
    try:
        return ZoneInfo(tz_name)
    except (ZoneInfoNotFoundError, ValueError):
        return ZoneInfo("UTC")


def is_valid_timezone(tz_name: str) -> bool:
    try:
        ZoneInfo(tz_name)
        return True
    except (ZoneInfoNotFoundError, ValueError):
        return False


def local_today(now_utc: datetime, tz_name: str) -> date:
    return now_utc.astimezone(safe_zone(tz_name)).date()
