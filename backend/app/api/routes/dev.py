from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.api.deps import DB, CurrentUser, Now, Rules
from app.core.config import get_settings
from app.core.errors import Forbidden
from app.schemas.learner import LearnerOut
from app.services import dev_service

router = APIRouter(prefix="/dev", tags=["demo tools"])


class TimeTravelIn(BaseModel):
    days: int = Field(default=1, ge=1, le=30)


def _ensure_enabled() -> None:
    if not get_settings().enable_dev_tools:
        raise Forbidden("Demo tools are disabled on this server.", code="dev_tools_disabled")


@router.post("/time-travel", response_model=LearnerOut)
def time_travel(payload: TimeTravelIn, db: DB, user: CurrentUser, now: Now, rules: Rules):
    """Pretend `days` days have passed for the current learner."""
    _ensure_enabled()
    return dev_service.time_travel(db, user, payload.days, now, rules)


@router.post("/reset", status_code=204)
def reset(db: DB):
    """Restore the seeded demo course and learner."""
    _ensure_enabled()
    bind = db.get_bind()
    db.close()  # release our connection before tables are dropped
    dev_service.reset_demo(bind)
