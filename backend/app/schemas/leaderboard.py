from typing import Literal

from pydantic import BaseModel


class LeaderboardEntryOut(BaseModel):
    rank: int
    user_id: int
    username: str
    display_name: str
    avatar_color: str
    xp: int
    is_me: bool


class LeaderboardOut(BaseModel):
    period: Literal["week", "all"]
    window_label: str
    entries: list[LeaderboardEntryOut]
    me: LeaderboardEntryOut | None  # filled when the learner is outside the top list
