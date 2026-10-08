/**
 * Exercise registry: the only place that maps an exercise `type` to UI.
 *
 * The lesson engine asks the registry for a renderer, an instruction and an
 * "is the answer complete?" predicate, and never branches on type itself.
 * Adding e.g. `listening` = one component + one entry here (+ one backend
 * handler). LessonPlayer, the state machine and the API stay untouched.
 */
import type { ComponentType } from "react";

import type { AnswerMap, ExerciseDataMap, ExerciseType } from "@/lib/types";

import { FillBlank } from "./FillBlank";
import { MatchPairs } from "./MatchPairs";
import { MultipleChoice } from "./MultipleChoice";
import type { ExerciseProps } from "./shared";
import { TypeAnswer } from "./TypeAnswer";
import { WordBank } from "./WordBank";

export interface ExerciseDefinition<T extends ExerciseType> {
  Component: ComponentType<ExerciseProps<T>>;
  /** Small label above the prompt. */
  kicker: string;
  isReady: (draft: AnswerMap[T] | null, data: ExerciseDataMap[T]) => boolean;
}

type Registry = { [T in ExerciseType]: ExerciseDefinition<T> };

export const exerciseRegistry: Registry = {
  multiple_choice: {
    Component: MultipleChoice,
    kicker: "Select the correct meaning",
    isReady: (d) => !!d?.option_id,
  },
  fill_blank: {
    Component: FillBlank,
    kicker: "Complete the sentence",
    isReady: (d) => !!d?.option_id,
  },
  word_bank: {
    Component: WordBank,
    kicker: "Build the translation",
    isReady: (d) => (d?.tile_ids.length ?? 0) > 0,
  },
  match_pairs: {
    Component: MatchPairs,
    kicker: "Match the pairs",
    isReady: (d, data) => !!d && Object.keys(d.pairs).length === data.left.length,
  },
  type_answer: {
    Component: TypeAnswer,
    kicker: "Type your answer",
    isReady: (d) => (d?.text.trim().length ?? 0) > 0,
  },
};

export function getExerciseDefinition<T extends ExerciseType>(type: T): ExerciseDefinition<T> | undefined {
  return exerciseRegistry[type] as ExerciseDefinition<T> | undefined;
}
