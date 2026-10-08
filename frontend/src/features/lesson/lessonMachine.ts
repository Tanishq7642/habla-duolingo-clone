/**
 * Lesson state machine.
 *
 *   loading ──LOADED──► answering ──SUBMIT──► checking ──ANSWER_OK──► feedback
 *      │                   ▲  ▲                   │                     │
 *  LOAD_FAILED             │  └──ANSWER_FAILED────┘ (draft preserved)   │ CONTINUE
 *      ▼                   └─────────────── next exercise ◄─────────────┤
 *    error                                                              ├─► completing ─COMPLETE_OK─► completed
 *                          HEARTS_REFILLED ◄── out_of_hearts ◄──────────┘        │ COMPLETE_FAILED (retry)
 *                                                │ QUIT
 *                                                ▼
 *                                              failed
 *
 * Pure: no React, no fetch. `useLesson` performs the side effects and feeds
 * results back in as events, which keeps every transition unit-testable and
 * all progression rules in one place.
 */
import type { ApiError } from "@/lib/api";
import type { AnswerResult, Completion, Exercise, Progress, Session } from "@/lib/types";

export type Phase =
  | "loading"
  | "error"
  | "answering"
  | "checking"
  | "feedback"
  | "completing"
  | "completed"
  | "out_of_hearts"
  | "failed";

export interface LessonState {
  phase: Phase;
  session: Session | null;
  currentId: number | null;
  /** The learner's in-progress answer for the current exercise (shape depends on type). */
  draft: unknown;
  result: AnswerResult | null;
  hearts: number;
  progress: Progress;
  xpEarned: number;
  /** Consecutive correct answers in this session. */
  combo: number;
  completion: Completion | null;
  error: ApiError | null;
  /** Bumped per exercise so renderers remount with fresh local UI state. */
  turn: number;
}

export type LessonEvent =
  | { type: "LOAD_START" }
  | { type: "LOADED"; session: Session }
  | { type: "LOAD_FAILED"; error: ApiError }
  | { type: "DRAFT_CHANGED"; draft: unknown }
  | { type: "SUBMIT" }
  | { type: "SKIP" }
  | { type: "ANSWER_OK"; result: AnswerResult }
  | { type: "ANSWER_FAILED"; error: ApiError }
  | { type: "CONTINUE" }
  | { type: "COMPLETE_OK"; completion: Completion }
  | { type: "COMPLETE_FAILED"; error: ApiError }
  | { type: "RETRY_COMPLETE" }
  | { type: "HEARTS_REFILLED"; hearts: number }
  | { type: "QUIT" };

export const initialLessonState: LessonState = {
  phase: "loading",
  session: null,
  currentId: null,
  draft: null,
  result: null,
  hearts: 0,
  progress: { completed: 0, total: 0 },
  xpEarned: 0,
  combo: 0,
  completion: null,
  error: null,
  turn: 0,
};

/** Errors that mean the client's view of the session is stale; only a reload fixes them. */
const DESYNC_CODES = new Set(["out_of_order", "attempt_closed", "attempt_not_found", "exercise_not_found"]);

function nextExercise(state: LessonState, nextId: number | null): LessonState {
  if (nextId === null) {
    return { ...state, phase: "completing", currentId: null, draft: null, result: null, error: null };
  }
  return { ...state, phase: "answering", currentId: nextId, draft: null, result: null, error: null, turn: state.turn + 1 };
}

export function lessonReducer(state: LessonState, event: LessonEvent): LessonState {
  switch (event.type) {
    case "LOAD_START":
      return { ...initialLessonState };

    case "LOADED": {
      const { session } = event;
      const loaded: LessonState = {
        ...state,
        session,
        hearts: session.hearts,
        progress: session.progress,
        error: null,
      };
      if (session.status !== "in_progress") return { ...loaded, phase: "failed" };
      if (session.kind === "lesson" && session.hearts <= 0 && session.next_exercise_id !== null) {
        return { ...loaded, phase: "out_of_hearts", currentId: session.next_exercise_id };
      }
      return nextExercise(loaded, session.next_exercise_id);
    }

    case "LOAD_FAILED":
      return { ...state, phase: "error", error: event.error };

    case "DRAFT_CHANGED":
      return state.phase === "answering" ? { ...state, draft: event.draft, error: null } : state;

    case "SUBMIT":
      return state.phase === "answering" && state.draft !== null ? { ...state, phase: "checking", error: null } : state;

    case "SKIP": // like Duolingo: allowed with no answer; the server records it as a miss
      return state.phase === "answering" ? { ...state, phase: "checking", error: null } : state;

    case "ANSWER_OK": {
      if (state.phase !== "checking") return state;
      const r = event.result;
      return {
        ...state,
        phase: "feedback",
        result: r,
        hearts: r.hearts_remaining,
        progress: r.progress,
        xpEarned: state.xpEarned + r.xp_earned,
        combo: r.correct ? state.combo + 1 : 0,
      };
    }

    case "ANSWER_FAILED": {
      if (state.phase !== "checking") return state;
      if (event.error.code === "out_of_hearts") return { ...state, phase: "out_of_hearts", hearts: 0 };
      if (DESYNC_CODES.has(event.error.code)) return { ...state, phase: "error", error: event.error };
      // Network / server hiccup: back to answering with the draft intact so nothing is lost.
      return { ...state, phase: "answering", error: event.error };
    }

    case "CONTINUE": {
      if (state.phase !== "feedback" || !state.result) return state;
      if (state.result.out_of_hearts) return { ...state, phase: "out_of_hearts" };
      return nextExercise(state, state.result.next_exercise_id);
    }

    case "COMPLETE_OK":
      return state.phase === "completing"
        ? { ...state, phase: "completed", completion: event.completion, hearts: event.completion.hearts, error: null }
        : state;

    case "COMPLETE_FAILED":
      return state.phase === "completing" ? { ...state, error: event.error } : state;

    case "RETRY_COMPLETE":
      return state.phase === "completing" ? { ...state, error: null } : state;

    case "HEARTS_REFILLED": {
      if (state.phase !== "out_of_hearts") return state;
      const refilled = { ...state, hearts: event.hearts };
      // Resume on the exercise that was pending (the missed one, or the next unseen).
      const pending = state.result ? state.result.next_exercise_id : state.currentId;
      return nextExercise(refilled, pending);
    }

    case "QUIT":
      return { ...state, phase: "failed" };
  }
}

// ---------------------------------------------------------------- selectors
export function currentExercise(state: LessonState): Exercise | null {
  if (!state.session || state.currentId === null) return null;
  return state.session.exercises.find((e) => e.id === state.currentId) ?? null;
}

export function progressRatio(state: LessonState): number {
  const { completed, total } = state.progress;
  return total === 0 ? 0 : completed / total;
}
