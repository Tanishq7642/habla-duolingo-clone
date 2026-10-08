"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useReducer, useRef } from "react";

import { exerciseRegistry } from "@/components/exercises/registry";
import { api, ApiError } from "@/lib/api";
import { invalidateAfterCompletion, patchLearner } from "@/lib/queries";
import { sfx } from "@/lib/sfx";
import type { ExerciseType, Session } from "@/lib/types";

import { currentExercise, initialLessonState, lessonReducer } from "./lessonMachine";

export type LessonSource =
  | { kind: "lesson"; lessonId: number }
  | { kind: "practice"; attemptId: number | null; onCreated?: (attemptId: number) => void };

const toApiError = (e: unknown) =>
  e instanceof ApiError ? e : new ApiError(0, "unknown", "Something unexpected happened.");

/**
 * Side-effect layer around the pure lesson reducer: performs API calls and
 * dispatches their outcomes. Server state that other screens care about
 * (hearts, XP) is patched/invalidated in the query cache here, once.
 */
export function useLesson(source: LessonSource) {
  const [state, dispatch] = useReducer(lessonReducer, initialLessonState);
  const queryClient = useQueryClient();
  const loadStarted = useRef(false);
  const completing = useRef(false);

  const load = useCallback(async () => {
    dispatch({ type: "LOAD_START" });
    try {
      let session: Session;
      if (source.kind === "lesson") session = await api.startLesson(source.lessonId);
      else if (source.attemptId !== null) session = await api.session(source.attemptId);
      else {
        session = await api.startPractice();
        source.onCreated?.(session.attempt_id);
      }
      dispatch({ type: "LOADED", session });
    } catch (e) {
      dispatch({ type: "LOAD_FAILED", error: toApiError(e) });
    }
    // Identity of the session to load; callbacks on `source` may change freely.
  }, [source.kind, source.kind === "lesson" ? source.lessonId : source.attemptId]);

  // Guard against StrictMode's double effect: starting a practice session twice
  // would create two sessions.
  useEffect(() => {
    if (loadStarted.current) return;
    loadStarted.current = true;
    void load();
  }, [load]);

  const exercise = currentExercise(state);
  const definition = exercise ? exerciseRegistry[exercise.type as ExerciseType] : undefined;
  const ready =
    state.phase === "answering" &&
    !!exercise &&
    !!definition &&
    (definition.isReady as (draft: unknown, data: unknown) => boolean)(state.draft, exercise.data);

  const setDraft = useCallback((draft: unknown) => dispatch({ type: "DRAFT_CHANGED", draft }), []);

  const submit = useCallback(async () => {
    if (!ready || !state.session || !exercise) return;
    dispatch({ type: "SUBMIT" });
    try {
      const result = await api.answer(state.session.attempt_id, exercise.id, state.draft);
      (result.correct ? sfx.correct : sfx.wrong)();
      patchLearner(queryClient, { hearts: result.hearts_remaining });
      dispatch({ type: "ANSWER_OK", result });
    } catch (e) {
      dispatch({ type: "ANSWER_FAILED", error: toApiError(e) });
    }
  }, [ready, state.session, state.draft, exercise, queryClient]);

  const next = useCallback(() => dispatch({ type: "CONTINUE" }), []);

  // Completion runs whenever we enter `completing` without an error. The server
  // makes it idempotent, so a retry after a timeout can never double-award.
  useEffect(() => {
    if (state.phase !== "completing" || state.error || completing.current || !state.session) return;
    completing.current = true;
    api
      .complete(state.session.attempt_id)
      .then(async (completion) => {
        sfx.complete();
        dispatch({ type: "COMPLETE_OK", completion });
        await invalidateAfterCompletion(queryClient);
      })
      .catch((e) => dispatch({ type: "COMPLETE_FAILED", error: toApiError(e) }))
      .finally(() => {
        completing.current = false;
      });
  }, [state.phase, state.error, state.session, queryClient]);

  const retryComplete = useCallback(() => dispatch({ type: "RETRY_COMPLETE" }), []);

  const heartsRefilled = useCallback((hearts: number) => dispatch({ type: "HEARTS_REFILLED", hearts }), []);

  const quit = useCallback(async () => {
    const attemptId = state.session?.attempt_id;
    dispatch({ type: "QUIT" });
    if (attemptId && state.session?.status === "in_progress") {
      await api.abandon(attemptId).catch(() => undefined); // best effort; it's reversible server-side state
      queryClient.invalidateQueries({ queryKey: ["path"] });
    }
  }, [state.session, queryClient]);

  return { state, exercise, definition, ready, setDraft, submit, next, retryComplete, heartsRefilled, quit, reload: load };
}
