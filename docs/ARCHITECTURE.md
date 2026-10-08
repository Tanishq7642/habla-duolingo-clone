# Habla — Architecture & Design

Habla is a vertical slice of a gamified language-learning product (Spanish for English
speakers). This document is the design that preceded implementation; the README links here.

---

## 1. System architecture

```
┌──────────────────────────── Browser ────────────────────────────┐
│ Next.js (App Router) + React + TypeScript + Tailwind            │
│                                                                 │
│  Pages ──► feature components ──► hooks (TanStack Query)        │
│                      │                     │                    │
│        LessonPlayer ─┴─ lessonMachine      └─ lib/api.ts (typed)│
│        (useReducer state machine)                               │
│        exerciseRegistry: type ─► renderer                       │
└───────────────────────────────┬─────────────────────────────────┘
                                │  /api/*  (Next rewrite → :8000)
┌───────────────────────────────▼─────────────────────────────────┐
│ FastAPI                                                         │
│  api/routes   thin: parse (Pydantic) → call service → schema    │
│  services     business rules, one transaction per use case      │
│     ├─ exercises/  validator registry (type ─► check + redact)  │
│     ├─ streak.py   pure date logic (no I/O)                     │
│     ├─ xp.py / levels   pure reward math                        │
│     ├─ unlocks.py  pure unlock derivation                       │
│     └─ achievements.py  data-driven rule evaluation             │
│  repositories  SQLAlchemy queries only                          │
│  models        SQLAlchemy 2.0 ORM                               │
└───────────────────────────────┬─────────────────────────────────┘
                                ▼
                       SQLite (WAL, FK enforced)
```

Principles

* **The server owns every rule** (answer correctness, hearts, XP, streak, unlocks). The client
  renders server responses; it never decides correctness or rewards.
* **Content and learner state are separate.** `courses → units → skills → lessons → exercises`
  are immutable-ish content; everything per-learner lives in progress / attempt tables. Unlock
  state is *derived*, never stored on content rows.
* **Pure domain functions** (streak, levels, unlocks, answer normalisation) are isolated from
  HTTP and the DB so they can be unit-tested with plain values.

## 2. Data model (ER)

```
languages 1──* courses (learning_language_id, from_language_id)
courses   1──* units 1──* skills 1──* lessons 1──* exercises

users ─┬─* lesson_attempts ──* attempt_exercises *── exercises
       │         └──────────* exercise_attempts  *── exercises
       ├─* user_lesson_progress *── lessons
       ├─* user_skill_progress  *── skills
       ├─* daily_activity
       └─* user_achievements    *── achievements
users *── courses (active_course_id)
```

| Table | Why it exists |
|---|---|
| `languages` | A course pairs a *learning* and a *from* language; adding French = new rows, no code. |
| `courses` | Root of the content tree; unique per language pair. |
| `units`, `skills`, `lessons` | Ordered content hierarchy (`position` + unique `(parent_id, position)`). |
| `exercises` | Polymorphic exercise: `type`, `prompt`, `data` (public render payload, JSON), `solution` (private, JSON, never serialised to clients), `explanation`, `xp`. Each type's `data`/`solution` shape is validated by a Pydantic model in the validator registry. A generic `exercise_options` table was rejected: word tiles, match pairs and typed answers don't share a shape, and per-type schemas are validated at write time anyway. |
| `users` | Learner profile + *wallet-like counters* that are mutated transactionally: `hearts`, `gems`, `total_xp`, `current_streak`, `longest_streak`, `last_active_date`, `daily_goal_xp`, `timezone`. `total_xp` is a deliberate denormalised counter (leaderboard / level reads are hot). |
| `lesson_attempts` | A *session* of play (kind `lesson` or `practice`). Holds status (`in_progress → completed / failed / abandoned`), reward receipt (`xp_awarded`, `bonus_xp`, `gems_awarded`) and is the **idempotency key** for completion. |
| `attempt_exercises` | The exercise set a session is made of (ordered). Lessons copy their exercises; practice sessions pick missed exercises. Makes lessons and practice one code path. |
| `exercise_attempts` | Every submitted answer (raw JSON + correctness). Source for mistake review, weak-area practice, “perfect lesson”. |
| `user_lesson_progress` | First completion time + times completed per lesson. Drives unlocks and mastery. |
| `user_skill_progress` | Per-skill XP and the moment the skill was first completed (a historical fact used for stats/achievements). |
| `daily_activity` | One row per learner per *local* day: XP, lessons. Daily goal, momentum, streak history and the weekly leaderboard are all derived from it. |
| `achievements` | Data-driven definitions: `metric` + `threshold`. New achievement = new row. |
| `user_achievements` | Unlock timestamp per learner (unique pair → can't be awarded twice). |

There is no `leaderboard_entries` table: the leaderboard is a query over `daily_activity`
(weekly) or `users.total_xp` (all-time). Seeded rivals are real `users` rows, so the same query
serves real users later.

**Why isn't progress stored on `skills`?** Skills are shared content; progress is per learner.
Putting `completed` on a skill row would make it a single-user app.

## 3. API contract (all JSON, prefix `/api`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/me` | Learner HUD: hearts, gems, XP, effective streak, today's goal progress, level, momentum |
| GET | `/me/stats` | Profile: stats, level, achievements (locked + unlocked) |
| GET | `/me/activity` | Last 7 days of XP + recent completed sessions |
| PATCH | `/me/settings` | Daily goal / timezone |
| POST | `/me/hearts/refill` | Spend gems to refill hearts (402 if insufficient gems) |
| GET | `/path` | Course → units → skills → lessons with derived state (locked/available/in_progress/completed, mastery) |
| GET | `/skills/{id}` | One skill with lesson states |
| POST | `/lessons/{id}/start` | Start or **resume** a lesson session → `{attempt, exercises(public), next_exercise_id}` (403 locked, 403 no hearts) |
| GET | `/attempts/{id}` | Resume a session after refresh |
| POST | `/attempts/{id}/answers` | `{exercise_id, answer}` → `{correct, feedback, correct_answer, explanation, xp_earned, hearts_remaining, out_of_hearts, progress, next_exercise_id}` |
| POST | `/attempts/{id}/complete` | **Idempotent** completion → rewards summary (`already_completed` on replay) |
| POST | `/attempts/{id}/abandon` | Quit / out-of-hearts exit |
| GET | `/attempts/{id}/review` | Mistake review (only after completion) |
| GET | `/practice/summary` | Weak-area count for the “Practice” card |
| POST | `/practice/start` | Build a practice session from missed exercises |
| GET | `/leaderboard?period=week\|all` | Ranked learners, current learner highlighted |

Answers are scoped to the attempt (`/attempts/{id}/answers`) rather than `/exercises/{id}/answer`
because an answer only has meaning inside a session (hearts, progress, completion).

Error envelope: `{"error": {"code": "lesson_locked", "message": "..."}}` with 400/402/403/404/409/422.

## 4. Frontend component architecture

```
app/
  (main)/layout.tsx         Sidebar (desktop) · MobileNav (mobile) · TopStats
  (main)/page.tsx           Learn: LearningPath + right rail (DailyGoal, Practice, Activity)
  (main)/leaderboard, profile, settings
  lesson/[lessonId]/page.tsx · practice/page.tsx  → LessonPlayer (full-screen)
components/
  layout/   Sidebar, MobileNav, TopStats, StatPopover
  path/     LearningPath, UnitBanner, SkillNode, ProgressRing, LessonPopover
  lesson/   LessonPlayer, LessonHeader, ExerciseRenderer, FeedbackBar, LessonComplete,
            OutOfHeartsModal, MistakeReview, QuitDialog
  exercises/ registry.ts, MultipleChoice, WordBank, MatchPairs, FillBlank, TypeAnswer
  gamification/ DailyGoalCard, StreakBadge, XPCounter, AchievementBadge, PracticeCard
  profile/  ProfileHeader, StatsGrid, AchievementGrid
  ui/       Button, Card, Modal, Skeleton, Toast, ErrorState, Mascot
lib/ api.ts (typed client) · queries.ts (TanStack Query hooks) · types.ts
features/lesson/ lessonMachine.ts (pure reducer) · useLesson.ts (effects)
```

**Server state** (learner, path, stats, leaderboard) lives only in TanStack Query. Answer
responses patch the cached learner (`hearts`) via `setQueryData`; completion invalidates
`me`, `path`, `stats` once. **Local UI state** (draft answer, selected tile, modal open) lives
in the lesson reducer or the exercise component.

## 5. Lesson state machine

```
 idle ─LOAD─► loading ─LOADED─► answering ◄───────────────┐
                │                 │ SUBMIT                │ CONTINUE (next exists)
                ▼ FAIL            ▼                       │
              error           checking ─RESULT─► feedback ┤
                                 │ FAIL (answer kept)     │ CONTINUE (none left)
                                 ▼                        ▼
                             answering(+error)       completing ─DONE─► completed
                                                          
 feedback(out_of_hearts) ─CONTINUE─► out_of_hearts ─REFILLED─► answering
                                         └─QUIT─► failed
```

States in code: `idle | loading | answering | checking | feedback | completing | completed |
out_of_hearts | failed | error`. `feedback` carries `correct: boolean` (ANSWER_CORRECT /
ANSWER_INCORRECT). The reducer is pure and unit-tested; side effects (API calls) live in
`useLesson`. The *queue* is server-owned: each answer response returns `next_exercise_id`
(first unseen exercise, then previously missed ones), so a refresh resumes exactly where the
learner was.

## 6. Exercise abstraction

Backend `services/exercises/registry.py`:

```python
class ExerciseHandler(Protocol):
    type: str
    DataModel: type[BaseModel]       # public payload shape
    SolutionModel: type[BaseModel]   # private answer key
    AnswerModel: type[BaseModel]     # what the client submits
    def check(self, data, solution, answer) -> CheckResult  # correct, display answer, note
```

Frontend `components/exercises/registry.ts`:

```ts
{ multiple_choice: { Component, emptyDraft, isReady, instruction }, ... }
```

Adding *listening*: one backend handler (data: `audio_text`, `tiles`; reuse word-bank check),
one React component, one registry line each side, seed rows. The LessonPlayer, state machine,
API and DB are untouched.

## 7. Gamification flow

```
answer ─► validate ─► exercise_attempt row
             ├─ wrong & lesson ─► hearts -= 1 (persisted immediately)
             └─ provisional XP shown (not credited yet)

complete (single transaction)
  CAS: UPDATE attempts SET status='completed' WHERE id=? AND status='in_progress'
    rowcount 0 ─► replay: return stored receipt, already_completed=true (no double XP)
  verify every attempt exercise answered correctly (else 409)
  xp = Σ exercise xp + completion bonus + perfect bonus
  users.total_xp, gems   daily_activity(today local) upsert
  streak = apply_activity(streak_state, today)          (pure)
  user_lesson_progress, user_skill_progress             (unlocks derive from these)
  achievements evaluated from metrics                    (data-driven)
  practice session: +1 heart instead of lesson bonus
COMMIT (any exception ─► rollback, nothing partially awarded)
```

## 8. Implementation phases

1. Architecture & schema (this doc) · 2. Backend foundation · 3. Seed data · 4. Learning path
· 5. Lesson engine · 6. Gamification · 7. Profile / leaderboard · 8. Polish · 9. Tests ·
10. Deployment readiness (README, env, scripts).
