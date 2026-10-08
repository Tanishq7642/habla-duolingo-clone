from pydantic import BaseModel

from app.schemas.learner import CourseRef


class LessonNodeOut(BaseModel):
    id: int
    position: int
    title: str
    status: str  # locked | available | completed


class SkillOut(BaseModel):
    id: int
    title: str
    description: str
    icon: str
    status: str  # locked | available | in_progress | completed
    lessons_completed: int
    lessons_total: int
    mastery: int
    mastery_cap: int
    xp: int
    next_lesson_id: int | None
    lessons: list[LessonNodeOut]


class UnitOut(BaseModel):
    id: int
    position: int
    title: str
    description: str
    theme: str
    skills: list[SkillOut]


class PathOut(BaseModel):
    course: CourseRef
    units: list[UnitOut]
