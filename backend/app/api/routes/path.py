from fastapi import APIRouter

from app.api.deps import DB, CurrentUser, Rules
from app.schemas.path import PathOut, SkillOut
from app.services import path_service

router = APIRouter(tags=["path"])


@router.get("/path", response_model=PathOut)
def get_path(db: DB, user: CurrentUser, rules: Rules):
    return path_service.get_path(db, user, rules)


@router.get("/skills/{skill_id}", response_model=SkillOut)
def get_skill(skill_id: int, db: DB, user: CurrentUser, rules: Rules):
    return path_service.get_skill(db, user, skill_id, rules)
