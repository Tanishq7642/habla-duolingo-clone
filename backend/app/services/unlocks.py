"""Derive path state (locked / available / in_progress / completed, mastery)
from course order + the learner's lesson completions.

Nothing here is stored: unlocks are a pure function of progress, so they can
never drift out of sync with it, and reordering content needs no migration.

Rules
  * Skills unlock linearly across the whole course: the first skill is open,
    every other skill opens when the previous one is completed.
  * Inside an open skill, lesson N opens when lesson N-1 has been completed once.
  * A skill is completed when each of its lessons has been completed once.
  * Mastery (0–cap) = full passes through the skill = min completions over its
    lessons; replaying lessons after completion raises it.
"""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class SkillOutline:
    skill_id: int
    lesson_ids: list[int]


@dataclass
class SkillState:
    status: str  # locked | available | in_progress | completed
    lessons_completed: int
    lessons_total: int
    mastery: int
    next_lesson_id: int | None
    lesson_status: dict[int, str] = field(default_factory=dict)


def derive_path_state(
    skills: list[SkillOutline],
    completions: dict[int, int],
    mastery_cap: int,
    active_lesson_ids: frozenset[int] = frozenset(),
) -> dict[int, SkillState]:
    result: dict[int, SkillState] = {}
    previous_completed = True
    for outline in skills:
        counts = [completions.get(lid, 0) for lid in outline.lesson_ids]
        done = sum(1 for c in counts if c > 0)
        completed = bool(outline.lesson_ids) and done == len(outline.lesson_ids)
        unlocked = previous_completed

        lesson_status: dict[int, str] = {}
        prev_lesson_done = True
        for lid, count in zip(outline.lesson_ids, counts):
            if not unlocked or not prev_lesson_done:
                lesson_status[lid] = "locked"
            elif count > 0:
                lesson_status[lid] = "completed"
            else:
                lesson_status[lid] = "available"
            prev_lesson_done = count > 0

        if not unlocked:
            status = "locked"
        elif completed:
            status = "completed"
        elif done > 0 or any(lid in active_lesson_ids for lid in outline.lesson_ids):
            status = "in_progress"
        else:
            status = "available"

        mastery = min(min(counts), mastery_cap) if completed else 0
        result[outline.skill_id] = SkillState(
            status=status,
            lessons_completed=done,
            lessons_total=len(outline.lesson_ids),
            mastery=mastery,
            next_lesson_id=_next_lesson(outline.lesson_ids, counts, unlocked, completed, mastery, mastery_cap),
            lesson_status=lesson_status,
        )
        previous_completed = completed
    return result


def _next_lesson(lesson_ids, counts, unlocked, completed, mastery, cap) -> int | None:
    if not unlocked or not lesson_ids:
        return None
    if not completed:
        return next(lid for lid, c in zip(lesson_ids, counts) if c == 0)
    if mastery >= cap:
        return lesson_ids[0]  # fully mastered: free replay
    # Level-up practice: the least-practised lesson first.
    return min(zip(lesson_ids, counts), key=lambda pair: pair[1])[0]
