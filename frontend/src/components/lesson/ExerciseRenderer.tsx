"use client";

import { exerciseRegistry } from "@/components/exercises/registry";
import type { ExerciseProps } from "@/components/exercises/shared";
import type { AnswerResult, Exercise, ExerciseType } from "@/lib/types";

interface Props {
  exercise: Exercise;
  draft: unknown;
  onChange: (draft: unknown) => void;
  locked: boolean;
  result: AnswerResult | null;
}

/** Resolves the renderer for an exercise type from the registry. */
export function ExerciseRenderer({ exercise, draft, onChange, locked, result }: Props) {
  const definition = exerciseRegistry[exercise.type as ExerciseType];
  if (!definition) {
    return (
      <div role="alert" className="rounded-3xl border-2 border-sun-400 bg-sun-50 p-6 text-ink-700">
        <p className="font-extrabold">This exercise type (“{exercise.type}”) isn't supported by this version of the app.</p>
        <p className="mt-1 text-sm">Refresh the page to load the latest version.</p>
      </div>
    );
  }
  // The registry guarantees Component and exercise.type agree; widen once here.
  const Component = definition.Component as React.ComponentType<ExerciseProps<ExerciseType>>;
  return (
    <section aria-labelledby={`prompt-${exercise.id}`} className="flex flex-col gap-6 sm:gap-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.15em] text-grape-500">{definition.kicker}</p>
        <h1 id={`prompt-${exercise.id}`} className="mt-1 text-2xl font-black text-ink-900 sm:text-3xl">
          {exercise.prompt}
        </h1>
      </div>
      <Component
        exercise={exercise}
        value={draft as never}
        onChange={onChange}
        locked={locked}
        result={result}
      />
    </section>
  );
}
