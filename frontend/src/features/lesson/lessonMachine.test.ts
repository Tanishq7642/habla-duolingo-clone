import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api";
import type { AnswerResult, Completion, Session } from "@/lib/types";

import { currentExercise, initialLessonState, lessonReducer, type LessonEvent, type LessonState } from "./lessonMachine";

const session = (over: Partial<Session> = {}): Session => ({
  attempt_id: 1,
  kind: "lesson",
  status: "in_progress",
  lesson_id: 10,
  title: "Fruit",
  subtitle: "Food · Lesson 1",
  exercises: [
    { id: 101, type: "multiple_choice", prompt: "Q1", data: { options: [] }, xp: 5 },
    { id: 102, type: "type_answer", prompt: "Q2", data: { source_text: "x", placeholder: "", answer_language: "es" }, xp: 7 },
  ],
  next_exercise_id: 101,
  progress: { completed: 0, total: 2 },
  mistakes: 0,
  hearts: 3,
  resumed: false,
  ...over,
});

const result = (over: Partial<AnswerResult> = {}): AnswerResult => ({
  correct: true,
  correct_answer: "manzana",
  note: null,
  explanation: "",
  detail: null,
  xp_earned: 5,
  hearts_remaining: 3,
  out_of_hearts: false,
  requeued: false,
  progress: { completed: 1, total: 2 },
  next_exercise_id: 102,
  ...over,
});

const run = (events: LessonEvent[], from: LessonState = initialLessonState) => events.reduce(lessonReducer, from);
const loaded = (s = session()) => run([{ type: "LOADED", session: s }]);

describe("lessonMachine", () => {
  it("starts on the server-chosen exercise", () => {
    const state = loaded();
    expect(state.phase).toBe("answering");
    expect(currentExercise(state)?.id).toBe(101);
    expect(state.hearts).toBe(3);
  });

  it("can't submit without an answer, and ignores answers while checking", () => {
    const state = loaded();
    expect(lessonReducer(state, { type: "SUBMIT" }).phase).toBe("answering");
    const checking = run([{ type: "DRAFT_CHANGED", draft: { option_id: "a" } }, { type: "SUBMIT" }], state);
    expect(checking.phase).toBe("checking");
    expect(lessonReducer(checking, { type: "DRAFT_CHANGED", draft: { option_id: "b" } }).draft).toEqual({ option_id: "a" });
  });

  it("skip is allowed without an answer, but only while answering", () => {
    const state = loaded();
    expect(lessonReducer(state, { type: "SKIP" }).phase).toBe("checking");
    const checking = run([{ type: "DRAFT_CHANGED", draft: {} }, { type: "SUBMIT" }], state);
    expect(lessonReducer(checking, { type: "SKIP" })).toBe(checking);
  });

  it("correct answer → feedback → next exercise with fresh draft", () => {
    let state = run([{ type: "DRAFT_CHANGED", draft: { option_id: "a" } }, { type: "SUBMIT" }, { type: "ANSWER_OK", result: result() }], loaded());
    expect(state.phase).toBe("feedback");
    expect(state.xpEarned).toBe(5);
    expect(state.combo).toBe(1);
    const turn = state.turn;
    state = lessonReducer(state, { type: "CONTINUE" });
    expect(state.phase).toBe("answering");
    expect(state.currentId).toBe(102);
    expect(state.draft).toBeNull();
    expect(state.turn).toBe(turn + 1);
  });

  it("wrong answer updates hearts and resets the combo", () => {
    const state = run(
      [{ type: "DRAFT_CHANGED", draft: { option_id: "b" } }, { type: "SUBMIT" },
       { type: "ANSWER_OK", result: result({ correct: false, xp_earned: 0, hearts_remaining: 2, requeued: true, progress: { completed: 0, total: 2 } }) }],
      { ...loaded(), combo: 4 },
    );
    expect(state.hearts).toBe(2);
    expect(state.combo).toBe(0);
    expect(state.progress.completed).toBe(0);
  });

  it("a network failure keeps the learner's answer", () => {
    const draft = { text: "hola" };
    const state = run(
      [{ type: "DRAFT_CHANGED", draft }, { type: "SUBMIT" }, { type: "ANSWER_FAILED", error: new ApiError(0, "network_error", "offline") }],
      loaded(),
    );
    expect(state.phase).toBe("answering");
    expect(state.draft).toBe(draft);
    expect(state.error?.code).toBe("network_error");
  });

  it("a desync error forces a reload instead of silently continuing", () => {
    const state = run(
      [{ type: "DRAFT_CHANGED", draft: {} }, { type: "SUBMIT" }, { type: "ANSWER_FAILED", error: new ApiError(409, "out_of_order", "stale") }],
      loaded(),
    );
    expect(state.phase).toBe("error");
  });

  it("losing the last heart leads to out_of_hearts, and a refill resumes the pending exercise", () => {
    let state = run(
      [{ type: "DRAFT_CHANGED", draft: {} }, { type: "SUBMIT" },
       { type: "ANSWER_OK", result: result({ correct: false, hearts_remaining: 0, out_of_hearts: true, next_exercise_id: 102 }) },
       { type: "CONTINUE" }],
      loaded(session({ hearts: 1 })),
    );
    expect(state.phase).toBe("out_of_hearts");
    state = lessonReducer(state, { type: "HEARTS_REFILLED", hearts: 5 });
    expect(state.phase).toBe("answering");
    expect(state.hearts).toBe(5);
    expect(state.currentId).toBe(102);
  });

  it("resuming a lesson with zero hearts opens the out-of-hearts state", () => {
    expect(loaded(session({ hearts: 0 })).phase).toBe("out_of_hearts");
  });

  it("practice sessions ignore hearts", () => {
    expect(loaded(session({ kind: "practice", hearts: 0 })).phase).toBe("answering");
  });

  it("last answer → completing → completed; a failed save can be retried", () => {
    let state = run(
      [{ type: "DRAFT_CHANGED", draft: {} }, { type: "SUBMIT" },
       { type: "ANSWER_OK", result: result({ next_exercise_id: null, progress: { completed: 2, total: 2 } }) },
       { type: "CONTINUE" }],
      loaded(),
    );
    expect(state.phase).toBe("completing");
    state = lessonReducer(state, { type: "COMPLETE_FAILED", error: new ApiError(500, "server_unavailable", "down") });
    expect(state.phase).toBe("completing");
    expect(state.error).not.toBeNull();
    state = lessonReducer(state, { type: "RETRY_COMPLETE" });
    expect(state.error).toBeNull();
    state = lessonReducer(state, { type: "COMPLETE_OK", completion: { hearts: 3 } as Completion });
    expect(state.phase).toBe("completed");
  });

  it("a session refreshed after the last answer goes straight to completing", () => {
    expect(loaded(session({ next_exercise_id: null, progress: { completed: 2, total: 2 } })).phase).toBe("completing");
  });
});
