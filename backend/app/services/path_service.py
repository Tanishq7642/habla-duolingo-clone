"""Learning path: course content joined with derived learner state."""

from sqlalchemy.orm import Session

from app.core.config import GameRules
from app.core.errors import NotFound
from app.models import Course, Skill, User
from app.repositories import content as content_repo
from app.repositories import progress as progress_repo
from app.schemas.learner import CourseRef
from app.schemas.path import LessonNodeOut, PathOut, SkillOut, UnitOut
from app.services.unlocks import SkillOutline, SkillState, derive_path_state


def active_course(db: Session, user: User) -> Course:
    if user.active_course_id is None:
        raise NotFound("You are not enrolled in a course yet.", code="no_active_course")
    course = content_repo.get_course_tree(db, user.active_course_id)
    if course is None:
        raise NotFound("Your course could not be found.", code="course_not_found")
    return course


def ordered_skills(course: Course) -> list[Skill]:
    return [skill for unit in course.units for skill in unit.skills]


def path_state(db: Session, user: User, course: Course, rules: GameRules) -> dict[int, SkillState]:
    outline = [SkillOutline(s.id, [l.id for l in s.lessons]) for s in ordered_skills(course)]
    return derive_path_state(
        outline,
        progress_repo.lesson_completions(db, user.id),
        rules.mastery_cap,
        frozenset(progress_repo.open_attempt_lesson_ids(db, user.id)),
    )


def course_ref(course: Course) -> CourseRef:
    lang = course.learning_language
    return CourseRef(id=course.id, title=course.title, language=lang.name, flag=lang.flag)


def _skill_out(skill: Skill, state: SkillState, xp: int, rules: GameRules) -> SkillOut:
    return SkillOut(
        id=skill.id,
        title=skill.title,
        description=skill.description,
        icon=skill.icon,
        status=state.status,
        lessons_completed=state.lessons_completed,
        lessons_total=state.lessons_total,
        mastery=state.mastery,
        mastery_cap=rules.mastery_cap,
        xp=xp,
        next_lesson_id=state.next_lesson_id,
        lessons=[
            LessonNodeOut(id=l.id, position=l.position, title=l.title, status=state.lesson_status[l.id])
            for l in skill.lessons
        ],
    )


def get_path(db: Session, user: User, rules: GameRules) -> PathOut:
    course = active_course(db, user)
    states = path_state(db, user, course, rules)
    xp = progress_repo.skill_xp_map(db, user.id)
    return PathOut(
        course=course_ref(course),
        units=[
            UnitOut(
                id=u.id,
                position=u.position,
                title=u.title,
                description=u.description,
                theme=u.theme,
                skills=[_skill_out(s, states[s.id], xp.get(s.id, 0), rules) for s in u.skills],
            )
            for u in course.units
        ],
    )


def get_skill(db: Session, user: User, skill_id: int, rules: GameRules) -> SkillOut:
    course = active_course(db, user)
    states = path_state(db, user, course, rules)
    skill = next((s for s in ordered_skills(course) if s.id == skill_id), None)
    if skill is None:
        raise NotFound("That skill doesn't exist in your course.", code="skill_not_found")
    return _skill_out(skill, states[skill.id], progress_repo.skill_xp_map(db, user.id).get(skill.id, 0), rules)


def find_skill_for_lesson(course: Course, lesson_id: int) -> Skill | None:
    for skill in ordered_skills(course):
        if any(l.id == lesson_id for l in skill.lessons):
            return skill
    return None


def skill_after(course: Course, skill_id: int) -> Skill | None:
    skills = ordered_skills(course)
    for i, s in enumerate(skills):
        if s.id == skill_id:
            return skills[i + 1] if i + 1 < len(skills) else None
    return None
