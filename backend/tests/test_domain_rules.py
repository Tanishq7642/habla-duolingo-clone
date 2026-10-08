"""Pure domain logic: streaks, rewards, levels, unlocks. No DB, no HTTP."""

from datetime import date, datetime, timezone

from app.core.clock import local_today
from app.core.config import GameRules
from app.services.rewards import level_for_xp, session_reward
from app.services.streak import StreakState, apply_activity, effective_streak
from app.services.unlocks import SkillOutline, derive_path_state

D = date(2026, 3, 10)


def day(offset: int) -> date:
    return date.fromordinal(D.toordinal() + offset)


class TestStreak:
    def test_first_activity_starts_streak(self):
        s = apply_activity(StreakState(0, 0, None), D)
        assert (s.current, s.longest, s.last_active_date) == (1, 1, D)

    def test_consecutive_day_increments(self):
        s = apply_activity(StreakState(4, 6, day(-1)), D)
        assert (s.current, s.longest) == (5, 6)

    def test_same_day_is_idempotent(self):
        state = StreakState(3, 3, D)
        assert apply_activity(state, D) == state

    def test_missed_day_resets_to_one(self):
        s = apply_activity(StreakState(9, 9, day(-2)), D)
        assert (s.current, s.longest) == (1, 9)

    def test_longest_tracks_new_record(self):
        assert apply_activity(StreakState(6, 6, day(-1)), D).longest == 7

    def test_clock_moving_backwards_never_penalises(self):
        state = StreakState(3, 3, day(1))  # learner travelled west
        assert apply_activity(state, D) == state

    def test_display_streak_alive_until_a_full_day_is_missed(self):
        assert effective_streak(StreakState(4, 4, day(-1)), D) == 4
        assert effective_streak(StreakState(4, 4, day(-2)), D) == 0

    def test_local_day_depends_on_timezone(self):
        late_utc = datetime(2026, 3, 9, 20, 0, tzinfo=timezone.utc)
        assert local_today(late_utc, "UTC") == date(2026, 3, 9)
        assert local_today(late_utc, "Asia/Kolkata") == date(2026, 3, 10)  # 01:30 next day
        assert local_today(late_utc, "Not/AZone") == date(2026, 3, 9)  # falls back to UTC


class TestRewards:
    rules = GameRules()

    def test_lesson_reward_with_perfect_bonus(self):
        r = session_reward("lesson", [5, 5, 7], mistakes=0, rules=self.rules)
        assert r.base_xp == 17
        assert r.bonus_xp == self.rules.completion_bonus_xp + self.rules.perfect_bonus_xp
        assert r.hearts == 0

    def test_mistakes_forfeit_perfect_bonus(self):
        r = session_reward("lesson", [5, 5], mistakes=1, rules=self.rules)
        assert r.bonus_xp == self.rules.completion_bonus_xp
        assert r.gems == self.rules.lesson_gems

    def test_practice_restores_a_heart(self):
        r = session_reward("practice", [5], mistakes=3, rules=self.rules)
        assert r.hearts == self.rules.practice_heart_reward and r.gems == 0

    def test_levels(self):
        assert level_for_xp(0).level == 1
        assert level_for_xp(49).level == 1
        assert level_for_xp(50).level == 2
        info = level_for_xp(178)
        assert (info.level, info.xp_into_level, info.xp_for_next_level) == (3, 28, 150)


class TestUnlocks:
    skills = [SkillOutline(1, [10, 11]), SkillOutline(2, [20, 21]), SkillOutline(3, [30])]

    def test_fresh_learner_only_first_lesson_open(self):
        st = derive_path_state(self.skills, {}, 5)
        assert st[1].status == "available"
        assert st[1].lesson_status == {10: "available", 11: "locked"}
        assert st[2].status == st[3].status == "locked"
        assert st[1].next_lesson_id == 10

    def test_partial_skill_is_in_progress_and_next_still_locked(self):
        st = derive_path_state(self.skills, {10: 1}, 5)
        assert st[1].status == "in_progress"
        assert st[1].lesson_status[11] == "available"
        assert st[2].status == "locked"

    def test_completing_skill_unlocks_next(self):
        st = derive_path_state(self.skills, {10: 1, 11: 1}, 5)
        assert st[1].status == "completed" and st[1].mastery == 1
        assert st[2].status == "available" and st[2].next_lesson_id == 20
        assert st[3].status == "locked"

    def test_mastery_is_full_passes_capped(self):
        st = derive_path_state(self.skills, {10: 3, 11: 2}, 5)
        assert st[1].mastery == 2
        assert st[1].next_lesson_id == 11  # least-practised lesson to level up
        assert derive_path_state(self.skills, {10: 9, 11: 9}, 5)[1].mastery == 5

    def test_open_session_marks_skill_in_progress(self):
        st = derive_path_state(self.skills, {}, 5, frozenset({10}))
        assert st[1].status == "in_progress"
