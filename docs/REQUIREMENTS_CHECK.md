# Requirements check (traceability matrix)

Every line of the assignment brief → where it's implemented → the automated test that proves it.
✅ = implemented and covered by a test · ◐ = implemented, verified manually · ➖ = intentionally a
placeholder, as the brief allows.

Test locations: backend `backend/tests/…` (pytest) · frontend unit/integration `frontend/src/**/*.test.ts(x)`
(Vitest) · end-to-end `frontend/e2e/*.spec.ts` (Playwright, real browser, desktop **and** mobile).

## 1. Learning path / skill tree

| Requirement | Implementation | Proof |
|---|---|---|
| Visual path of units & skills | `components/path/LearningPath.tsx`, `SkillNode.tsx` (from `GET /api/path`) | ✅ e2e `lesson-loop: core loop` |
| Lock/unlock progression | `services/unlocks.py` (derived, never stored); enforced in `session_service.start_lesson` | ✅ `test_domain_rules::TestUnlocks`, property `test_unlock_invariants`, `test_full_course`, e2e `locked and unknown lessons…` |
| Completed vs available vs locked states | `SkillState.status` → node styling and aria-label | ✅ e2e checks `Animals: Locked` → `Animals: Start`, `Food: Completed` |
| Progress rings / crowns per skill | `ui/Progress.tsx` `ProgressRing`, `ui/Crown.tsx` (crown = mastery level) | ✅ `TestUnlocks::test_mastery_is_full_passes_capped`, `test_full_course` (mastery ≥ 1 everywhere) |
| Top bar: streak, XP, hearts, gems | `layout/TopStats.tsx` with explanatory popovers | ✅ e2e `stat popovers explain each metric`, `topStat()` assertions |

## 2. Lesson player

| Requirement | Implementation | Proof |
|---|---|---|
| Sequence of exercises | Server-owned queue `session_service.next_exercise_id` | ✅ `test_wrong_answer_costs_a_heart_and_requeues`, `test_out_of_order_and_repeat_answers_rejected` |
| Multiple choice | `MultipleChoiceHandler` / `MultipleChoice.tsx` | ✅ `TestMultipleChoice`, e2e |
| Translate (word bank / tap the words) | `WordBankHandler` / `WordBank.tsx` | ✅ `TestWordBank`, `exercises.test.tsx › WordBank`, e2e |
| Match pairs | `MatchPairsHandler` / `MatchPairs.tsx` | ✅ `TestMatchPairs` (incl. board never pre-aligned), `exercises.test.tsx › MatchPairs`, e2e |
| Fill in the blank | `FillBlankHandler` / `FillBlank.tsx` | ✅ `TestFillBlank`, e2e |
| Type the answer (with normalisation) | `TypeAnswerHandler` + `normalize.py` | ✅ `TestTypeAnswer`, properties `test_normalize_*`, e2e types `La Leche!` |
| Immediate correct/incorrect feedback bar | `lesson/FeedbackBar.tsx` | ✅ `LessonPlayer.test.tsx › whole loop`, e2e checks "Not quite" + correct answer |
| Progress bar across the lesson | `LessonHeader.tsx` → `progressRatio` | ✅ e2e `refreshing mid-lesson…` (progress ≠ 0 after resume) |
| Lose a heart on a wrong answer | Atomic `hearts = hearts - 1 WHERE hearts > 0` | ✅ `test_wrong_answer_costs_a_heart…`, `test_parallel_wrong_answers_cost_exactly_one_heart`, e2e (4 → 3) |
| Lesson end / failure handled | Phases `out_of_hearts`, `failed`; `OutOfHeartsModal`, `QuitDialog` | ✅ `lessonMachine.test.ts`, `test_out_of_hearts_blocks_play…`, e2e `running out of hearts…`, `quitting asks…` |
| Award XP and mark skill progress on completion | `session_service.complete` (one transaction) | ✅ `test_completion_updates_everything_and_unlocks_next_skill`, `test_full_course`, e2e |

## 3. Gamification & progress

| Requirement | Implementation | Proof |
|---|---|---|
| Streak increments on daily activity | `services/streak.py` (pure) | ✅ `TestStreak`, property `test_streak_matches_a_brute_force_definition` |
| Day logic simulated / testable | Injectable clock (`deps.get_now`) + demo time travel (`/api/dev/time-travel`) | ✅ `test_streak_resets_after_missed_day`, `test_dev_tools.py`, e2e `streak rules via demo tools` |
| XP totals | `users.total_xp`, levels in `rewards.py` | ✅ `TestRewards`, `test_level_is_consistent_with_thresholds`, `test_full_course` (API = DB) |
| Simple leaderboard (seeded) | `leaderboard_service.py` over real user rows | ✅ `test_leaderboard_highlights_learner`, e2e `leaderboard is ranked…` |
| Hearts regeneration via practice/refill | `practice_service`, `learner_service.refill_hearts`, Shop page | ✅ `test_out_of_hearts_blocks_play_until_practice_or_refill`, `test_refill_requires_gems`, `test_parallel_refills_charge_gems_once`, e2e refill + practice |
| Daily goal / XP goal indicator | `daily_activity` + `DailyGoalCard`, configurable in Settings | ✅ `test_completion_updates_everything…` (`just_reached`), e2e goal change to 30 XP |
| Progress persists per user | All state in SQLite; UI is server-rendered from the API | ✅ e2e `core loop` hard-reloads and re-checks everything |

## 4. Content management

| Requirement | Implementation | Proof |
|---|---|---|
| Units/skills/lessons/exercises stored in DB and seeded | `models/content.py`, `seed/course_spanish.py`, `seed/seed.py` (auto-seed on empty DB) | ✅ `test_seed_content_is_valid`, `test_reset_restores_seed` |
| Learner profile page with stats (streak, total XP, achievements) | `/profile` → `GET /api/me/stats` | ✅ e2e `profile shows stats and achievements…` |
| All learner progress persists | as above | ✅ |

## 5. Duolingo experience

| Requirement | Implementation | Proof |
|---|---|---|
| Playful, colourful UI with mascot | Duolingo palette (`tailwind.config.ts`), original SVG mascot `ui/Mascot.tsx` | ◐ visual review on desktop and mobile |
| Animated feedback | shake, heart-loss, flying +XP, confetti, count-up XP | ◐ visual; reduced-motion path covered by `LessonPlayer.test.tsx` |
| Modals: lesson complete, out of hearts | `LessonComplete.tsx`, `OutOfHeartsModal.tsx` | ✅ `LessonPlayer.test.tsx`, e2e |
| Toasts & celebratory states | `ui/Toast.tsx`, confetti, goal-reached card | ✅ e2e (refill / settings / demo-tool toasts) |
| Path navigation & progress visuals | sidebar (desktop), bottom tabs (mobile) | ✅ e2e runs every flow on `desktop` and `mobile` projects |
| Settings placeholders | `/settings` "Coming soon" sections | ✅ e2e |

## Mocked / placeholders (as allowed)

| Item | Status |
|---|---|
| Speech recognition / pronunciation | ➖ Settings "Coming soon" (TTS 🔊 listening works via the Web Speech API) |
| Purchases / Super | ➖ Gems mocked; Shop "Super" + "Streak Freeze" coming soon |
| Friends / social | ➖ Profile + Quests "Coming soon"; leaderboard is seeded but real |
| Multiple languages | ➖ One course seeded; schema supports more |
| Authentication | ➖ Default learner via `get_current_user` (single swap point) |

## Bonus

| Bonus item | Status |
|---|---|
| Audio for exercises | ✅ text-to-speech speaker buttons |
| Achievements / badges | ✅ data-driven, `test_achievements_unlock_once`, `test_full_course` |
| Real functioning leaderboard | ✅ query over real users' activity |
| Responsive design | ✅ e2e suite runs on desktop and Pixel 7 |
| Timed challenge mode, dark mode | ✗ not implemented |

## Non-functional checks

| Concern | Proof |
|---|---|
| Answers never leak to the browser | `test_session_never_exposes_solutions`, `test_full_course` (checks every exercise served) |
| Duplicate / concurrent requests | `test_concurrency.py`: parallel answers, completions, refills, starts |
| Malformed input | `test_malformed_answer_is_422_and_costs_nothing`, `TestMultipleChoice::test_malformed_payload_rejected` |
| Other users' data | `test_other_learners_session_is_invisible` |
| Network failures | `LessonPlayer.test.tsx › keeps the learner's answer…`, e2e `API down → friendly error with retry` |
| Accessibility (WCAG 2 A/AA) | e2e `a11y.spec.ts` (axe-core) on every page and inside a lesson |
| Production build | `next build` clean; e2e runs against `next start` |

---

## Testing pyramid

| Layer | Tool | Count | What it proves |
|---|---|---|---|
| Pure domain rules | pytest | 40 | streak / levels / unlocks / answer checking with plain values |
| Property-based | pytest + Hypothesis | 8 properties (100 generated cases each) | invariants hold for *any* input |
| API / service integration | pytest + TestClient | 24 | every endpoint, error codes, idempotency, time travel |
| Concurrency | pytest + threads + real SQLite file | 5 | double-clicks / two tabs can't double-award or double-charge |
| Whole-course | pytest | 1 | all 15 lessons playable in order; unlocks chain correctly |
| Frontend unit | Vitest | 17 | state machine transitions, exercise interactions |
| Frontend integration | Vitest + Testing Library | 4 | real LessonPlayer against a fake backend |
| End-to-end | Playwright (desktop + mobile) | 21 scenarios × 2 viewports | real browser, real API, real database |
| Accessibility | axe-core in Playwright | 7 pages | WCAG 2 A/AA |

Totals: **80 backend** (pytest counts parametrised cases) · **21 frontend** · **41 end-to-end runs**. Backend line coverage: **94%** (`python -m pytest --cov=app`).

## Bugs the step-up tests found (and the fixes)

1. **Double-tap cost multiple hearts (race condition).** With the timing window forced open, 8 parallel
   copies of one wrong answer were *all* accepted. Fix: optimistic concurrency, where each answer must claim
   slot `answer_count = N → N+1` (`repositories/progress.claim_answer_slot`).
2. **Possible lost XP when two tabs finish different lessons at once.** Rewards were added to a learner
   row read before acquiring the write lock. Fix: re-read the learner `FOR UPDATE` after claiming the
   attempt (`session_service.complete`).
3. **Parallel heart refills** could pass the checks twice. Fix: one conditional `UPDATE … WHERE hearts < max
   AND gems >= cost`.
4. **Parallel "start lesson"** could open two sessions. Fix: partial unique index (one open session per
   learner and lesson) and resuming on conflict.
5. **Unlock edge case (found by Hypothesis):** if content is inserted before a skill the learner already
   finished, that skill showed as locked but still unlocked the next one. Fix: completion is sticky.
6. **Accessibility (found by axe):** grey and coloured text was below WCAG AA contrast. Fix: accessible text
   shades (`*-800`, grey `#6B6B6B`). Duolingo's white-on-bright buttons and banners are a documented
   exception marked `data-brand-surface`.
