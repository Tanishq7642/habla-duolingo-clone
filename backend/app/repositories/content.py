"""Read access to course content."""

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models import Course, Exercise, Lesson, Skill, Unit


def get_course_tree(db: Session, course_id: int) -> Course | None:
    """Whole course in 4 queries (selectin), not N+1."""
    stmt = (
        select(Course)
        .where(Course.id == course_id)
        .options(
            selectinload(Course.learning_language),
            selectinload(Course.units).selectinload(Unit.skills).selectinload(Skill.lessons),
        )
    )
    return db.scalars(stmt).first()


def get_course_header(db: Session, course_id: int) -> Course | None:
    """Course + its language in one query (no units/skills): for headers and HUDs."""
    stmt = select(Course).where(Course.id == course_id).options(joinedload(Course.learning_language))
    return db.scalars(stmt).first()


def get_lesson(db: Session, lesson_id: int) -> Lesson | None:
    return db.get(Lesson, lesson_id)


def get_skill_with_lessons(db: Session, skill_id: int) -> Skill | None:
    stmt = select(Skill).where(Skill.id == skill_id).options(selectinload(Skill.lessons))
    return db.scalars(stmt).first()


def lesson_exercises(db: Session, lesson_id: int) -> list[Exercise]:
    return list(db.scalars(select(Exercise).where(Exercise.lesson_id == lesson_id).order_by(Exercise.position)))


def course_id_for_lesson(db: Session, lesson_id: int) -> int | None:
    stmt = (
        select(Unit.course_id)
        .join(Skill, Skill.unit_id == Unit.id)
        .join(Lesson, Lesson.skill_id == Skill.id)
        .where(Lesson.id == lesson_id)
    )
    return db.scalar(stmt)
