from fastapi import APIRouter

from app.api.deps import DB, CurrentUser, Now, Rules
from app.schemas.learner import ActivityOut, HeartsOut, LearnerOut, SettingsIn, StatsOut
from app.services import learner_service

router = APIRouter(prefix="/me", tags=["learner"])


@router.get("", response_model=LearnerOut)
def get_me(db: DB, user: CurrentUser, now: Now, rules: Rules):
    return learner_service.learner_view(db, user, now, rules)


@router.get("/stats", response_model=StatsOut)
def get_stats(db: DB, user: CurrentUser, now: Now, rules: Rules):
    return learner_service.stats(db, user, now, rules)


@router.get("/activity", response_model=ActivityOut)
def get_activity(db: DB, user: CurrentUser, now: Now):
    return learner_service.activity(db, user, now)


@router.patch("/settings", response_model=LearnerOut)
def update_settings(payload: SettingsIn, db: DB, user: CurrentUser, now: Now, rules: Rules):
    return learner_service.update_settings(db, user, payload, now, rules)


@router.post("/hearts/refill", response_model=HeartsOut)
def refill_hearts(db: DB, user: CurrentUser, rules: Rules):
    return learner_service.refill_hearts(db, user, rules)
