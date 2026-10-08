"""Reward and level math. Pure functions; balance numbers come from GameRules."""

from dataclasses import dataclass

from app.core.config import GameRules


@dataclass(frozen=True)
class Reward:
    base_xp: int
    bonus_xp: int
    gems: int
    hearts: int

    @property
    def total_xp(self) -> int:
        return self.base_xp + self.bonus_xp


def session_reward(kind: str, exercise_xp: list[int], mistakes: int, rules: GameRules) -> Reward:
    """XP for every exercise in the session (each counted once, however many
    tries it took) plus bonuses. Practice trades the lesson bonus for a heart."""
    base = sum(exercise_xp)
    perfect = mistakes == 0
    if kind == "practice":
        return Reward(base_xp=base, bonus_xp=rules.practice_completion_xp, gems=0,
                      hearts=rules.practice_heart_reward)
    bonus = rules.completion_bonus_xp + (rules.perfect_bonus_xp if perfect else 0)
    gems = rules.lesson_gems + (rules.perfect_lesson_gems if perfect else 0)
    return Reward(base_xp=base, bonus_xp=bonus, gems=gems, hearts=0)


@dataclass(frozen=True)
class LevelInfo:
    level: int
    xp_into_level: int
    xp_for_next_level: int


def level_threshold(level: int) -> int:
    """Cumulative XP needed to reach `level` (L1=0, L2=50, L3=150, L4=300…).
    Each level costs 50 XP more than the previous one."""
    return 25 * level * (level - 1)


def level_for_xp(total_xp: int) -> LevelInfo:
    level = 1
    while level_threshold(level + 1) <= total_xp:
        level += 1
    start = level_threshold(level)
    return LevelInfo(level, total_xp - start, level_threshold(level + 1) - start)
