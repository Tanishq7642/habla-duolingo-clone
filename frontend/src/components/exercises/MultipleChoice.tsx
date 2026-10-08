"use client";

import clsx from "clsx";
import { useCallback } from "react";

import { tileClass, useNumberKeys, type ExerciseProps, type TileState } from "./shared";

export function MultipleChoice({ exercise, value, onChange, locked, result }: ExerciseProps<"multiple_choice">) {
  const { options } = exercise.data;
  const hasPictures = options.some((o) => o.emoji);
  const pick = useCallback((i: number) => onChange({ option_id: options[i].id }), [onChange, options]);
  useNumberKeys(options.length, pick, !locked);

  const stateFor = (id: string, text: string): TileState => {
    const selected = value?.option_id === id;
    if (result) {
      if (text === result.correct_answer) return "correct";
      if (selected) return "wrong";
      return "idle";
    }
    return selected ? "selected" : "idle";
  };

  return (
    <div
      role="radiogroup"
      aria-label="Answer options"
      className={clsx("grid gap-3", hasPictures ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2")}
    >
      {options.map((o, i) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value?.option_id === o.id}
          disabled={locked}
          onClick={() => onChange({ option_id: o.id })}
          className={tileClass(
            stateFor(o.id, o.text),
            clsx("relative flex items-center gap-3 p-4 text-left text-lg", hasPictures && "flex-col justify-center py-6 text-center"),
          )}
        >
          {o.emoji && <span className="text-5xl leading-none sm:text-6xl" aria-hidden>{o.emoji}</span>}
          <span className="flex items-center gap-3">
            <kbd
              className={clsx(
                "hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-ink-200 text-xs text-ink-500 sm:inline-flex",
                hasPictures && "absolute left-2 top-2",
              )}
            >
              {i + 1}
            </kbd>
            {o.text}
          </span>
        </button>
      ))}
    </div>
  );
}
