from typing import Literal

from fastapi import APIRouter

from app.api.deps import DB, CurrentUser, Now, Rules
from app.schemas.leaderboard import LeaderboardOut
from app.services import leaderboard_service

router = APIRouter(tags=["leaderboard"])


@router.get("/leaderboard", response_model=LeaderboardOut)
def get_leaderboard(db: DB, user: CurrentUser, now: Now, rules: Rules, period: Literal["week", "all"] = "week"):
    return leaderboard_service.leaderboard(db, user, period, now, rules)
