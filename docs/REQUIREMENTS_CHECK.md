# Requirements check

Every line of the assignment brief → where it's implemented → the automated test that covers it.
✅ = implemented and covered by a test · ◐ = implemented, verified manually in the browser · ➖ = an
intentional placeholder, as the brief allows.

Tests: backend `backend/tests/` (pytest) · frontend `frontend/src/**/*.test.ts(x)` (Vitest).

## 1. Learning path / skill tree

| Requirement | Implementation | Proof |
|---|---|---|
| Visual path of units & skills | `components/path/LearningPath.tsx`, `SkillNode.tsx` (from `GET /api/path`) | ◐ + `test_whole_course_can_be_completed_in_order` |
| Lock/unlock progression | `services/unlocks.py` (derived, never stored); enforced in `session_service.start_lesson` | ✅ `TestUnlocks`, `test_locked_lesson_cannot_start`, `test_whole_course_can_be_completed_in_order` |
| Completed / available / locked states | `SkillState.status` → node styling and aria-label | ✅ `TestUnlocks`, `test_completion_updates_everything_and_unlocks_next_skill` |
| Progress rings / crowns per skill | `ui/Progress.tsx` `ProgressRing`, `ui/Crown.tsx` (crown level = mastery) | ✅ `test_mastery_is_full_passes_capped` |
| Top bar: streak, XP, hearts, gems | `layout/TopStats.tsx` with explanatory popovers | ◐ |

## 2. Lesson player

| Requirement | Implementation | Proof |
|---|---|---|
| Sequence of exercises | Server-owned queue `session_service.next_exercise_id`; Skip counts as a miss | ✅ `test_wrong_answer_costs_a_heart_and_requeues`, `test_out_of_order_and_repeat_answers_rejected`, `test_skip_counts_as_a_miss_and_comes_back` |
| Multiple choice | `MultipleChoiceHandler` / `MultipleChoice.tsx` | ✅ `TestMultipleChoice`, `LessonPlayer › runs the whole loop` |
| Translate (word bank / tap the words) | `WordBankHandler` / `WordBank.tsx` | ✅ `TestWordBank`, `WordBank` (Vitest) |
| Match pairs | `MatchPairsHandler` / `MatchPairs.tsx` | ✅ `TestMatchPairs`, `MatchPairs` (Vitest) |
| Fill in the blank | `FillBlankHandler` / `FillBlank.tsx` | ✅ `TestFillBlank` |
| Type the answer (with normalisation) | `TypeAnswerHandler` + `normalize.py` | ✅ `TestTypeAnswer`, `TestNormalize` |
| Immediate correct/incorrect feedback bar | `lesson/FeedbackBar.tsx` | ✅ `LessonPlayer › runs the whole loop` |
| Progress bar across the lesson | `LessonHeader.tsx` → `progressRatio` | ✅ `lessonMachine` tests |
| Lose a heart on a wrong answer | Atomic `hearts = hearts - 1 WHERE hearts > 0` | ✅ `test_wrong_answer_costs_a_heart_and_requeues` |
| Lesson end / failure handled | Phases `out_of_hearts`, `failed`; `OutOfHeartsModal`, `QuitDialog` | ✅ `lessonMachine` tests, `test_out_of_hearts_blocks_play_until_practice_or_refill`, `LessonPlayer › out-of-hearts modal` |
| Award XP and mark skill progress on completion | `session_service.complete` (one transaction) | ✅ `test_completion_updates_everything_and_unlocks_next_skill` |

## 3. Gamification & progress

| Requirement | Implementation | Proof |
|---|---|---|
| Streak increments on daily activity | `services/streak.py` (pure functions) | ✅ `TestStreak` |
| Day logic simulated / testable | Injectable clock (`deps.get_now`) + demo time travel (`/api/dev/time-travel`) | ✅ `test_streak_resets_after_missed_day`, `test_time_travel_then_lesson_extends_streak` |
| XP totals | `users.total_xp`, levels in `rewards.py` | ✅ `TestRewards`, `test_completion_updates_everything_and_unlocks_next_skill` |
| Simple leaderboard (seeded) | `leaderboard_service.py` over real user rows | ✅ `test_leaderboard_highlights_learner` |
| Hearts regeneration via practice/refill | `practice_service`, `learner_service.refill_hearts`, Shop page | ✅ `test_out_of_hearts_blocks_play_until_practice_or_refill`, `test_refill_requires_gems` |
| Daily goal / XP goal indicator | `daily_activity` + `DailyGoalCard`, configurable in Settings | ✅ `test_completion_updates_everything_and_unlocks_next_skill`, `test_daily_goal_setting_validation` |
| Progress persists per user | All state in the database; the UI renders from the API | ✅ `test_whole_course_can_be_completed_in_order` (API and database agree) |

## 4. Content management

| Requirement | Implementation | Proof |
|---|---|---|
| Units/skills/lessons/exercises stored in DB and seeded | `models/content.py`, `seed/course_spanish.py`, `seed/seed.py` | ✅ `test_seed_content_is_valid`, `test_reset_restores_seed` |
| Learner profile with stats (streak, total XP, achievements) | `/profile` → `GET /api/me/stats` | ✅ `test_achievements_unlock_once` |

## 5. Duolingo experience

| Requirement | Implementation | Proof |
|---|---|---|
| Playful, colourful UI with mascot | Duolingo-style palette, original SVG mascot `ui/Mascot.tsx`, illustrated nav icons | ◐ |
| Animated feedback | Shake, heart loss, flying +XP, confetti, count-up XP | ◐ |
| Modals: lesson complete, out of hearts | `LessonComplete.tsx`, `OutOfHeartsModal.tsx` | ✅ `LessonPlayer` tests |
| Toasts & celebratory states | `ui/Toast.tsx`, confetti, goal-reached card | ◐ |
| Path navigation & progress visuals | Sidebar (desktop), bottom tabs (mobile) | ◐ |
| Settings placeholders | `/settings` "Coming soon" sections | ◐ |

## Mocked / placeholders (as allowed)

| Item | Status |
|---|---|
| Speech recognition / pronunciation | ➖ Settings "Coming soon" (text-to-speech 🔊 works via the browser's Web Speech API) |
| Purchases / Super | ➖ Gems mocked; Shop "Super" and "Streak Freeze" coming soon |
| Friends / social | ➖ "Coming soon"; the leaderboard is seeded but real |
| Multiple languages | ➖ One course seeded; the schema supports more |
| Authentication | ➖ Single default learner via `get_current_user` (one place to swap in real auth) |

## Bonus

| Bonus item | Status |
|---|---|
| Audio for exercises | ✅ Text-to-speech speaker buttons |
| Achievements / badges | ✅ Data-driven, `test_achievements_unlock_once` |
| Real functioning leaderboard | ✅ Query over real users' activity |
| Dark mode | ✅ Settings → Appearance, `theme` tests (Vitest) |
| Responsive design | ◐ Desktop sidebar + right rail, mobile bottom tabs |
| Timed challenge mode | ✗ Not implemented |

## Non-functional checks

| Concern | Proof |
|---|---|
| Answers never leak to the browser | `test_session_never_exposes_solutions` |
| Duplicate completion can't double-award XP | `test_duplicate_completion_is_idempotent` |
| Malformed input | `test_malformed_answer_is_422_and_costs_nothing`, `TestMultipleChoice::test_malformed_payload_rejected` |
| Other users' data | `test_other_learners_session_is_invisible` |
| Network failures keep the learner's answer | `LessonPlayer › keeps the learner's answer when the network fails` |
| Production build | `npm run build` clean; `npm run typecheck` clean |

Totals: **75 backend** tests (94% line coverage, `python -m pytest --cov=app`) · **27 frontend** tests.
