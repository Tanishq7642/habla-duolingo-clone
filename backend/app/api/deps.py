"""Request-scoped dependencies.

Identity is deliberately simple: an optional `X-User-Id` header, defaulting to
the seeded demo learner. Every route already receives `current_user` through
this one dependency, so swapping in real auth (session cookie / JWT → user)
means changing only `get_current_user`.
"""

from datetime import datetime
from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.clock import system_clock
from app.core.config import GameRules, get_settings
from app.core.errors import NotFound
from app.db.session import get_db
from app.models import User
from app.repositories import progress as progress_repo


def get_rules() -> GameRules:
    return get_settings().rules


def get_now() -> datetime:
    return system_clock()


def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    x_user_id: Annotated[int | None, Header()] = None,
) -> User:
    user = (
        progress_repo.get_user(db, x_user_id)
        if x_user_id is not None
        else progress_repo.get_user_by_username(db, get_settings().demo_username)
    )
    if user is None:
        raise NotFound("Learner not found. Did you run the seed script?", code="user_not_found")
    return user


DB = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
Rules = Annotated[GameRules, Depends(get_rules)]
Now = Annotated[datetime, Depends(get_now)]
