"use client";

import clsx from "clsx";
import { useCallback } from "react";

import { tileClass, useNumberKeys, type ExerciseProps } from "./shared";

export function FillBlank({ exercise, value, onChange, locked, result }: ExerciseProps<"fill_blank">) {
  const { before, after, translation, options } = exercise.data;
  const chosen = options.find((o) => o.id === value?.option_id);
  const pick = useCallback((i: number) => onChange({ option_id: options[i].id }), [onChange, options]);
  useNumberKeys(options.length, pick, !locked);

  const blankState = !chosen ? "empty" : result ? (result.correct ? "correct" : "wrong") : "filled";

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-3xl border-2 border-ink-200 bg-white p-5 sm:p-6">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-3 text-2xl font-extrabold text-ink-900">
          {before && <span>{before}</span>}
          <button
            type="button"
            disabled={locked || !chosen}
            onClick={() => onChange(null)}
            aria-label={chosen ? `Blank filled with ${chosen.text}. Tap to clear.` : "Empty blank"}
            className={clsx(
              "inline-flex min-w-[5.5rem] items-center justify-center rounded-xl border-b-4 px-3 py-1 transition",
              blankState === "empty" && "border-ink-300 bg-ink-50 text-transparent",
              blankState === "filled" && "border-ocean-500 bg-ocean-50 text-ocean-700 animate-pop",
              blankState === "correct" && "border-leaf-500 bg-leaf-50 text-leaf-700",
              blankState === "wrong" && "border-coral-500 bg-coral-50 text-coral-700 animate-shake",
            )}
          >
            {chosen?.text ?? "____"}
          </button>
          {after && <span>{after}</span>}
        </p>
        {translation && <p className="mt-3 text-base font-semibold text-ink-500">“{translation}”</p>}
      </div>

      <div className="flex flex-wrap justify-center gap-3" role="radiogroup" aria-label="Words to fill the blank">
        {options.map((o, i) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value?.option_id === o.id}
            disabled={locked}
            onClick={() => onChange({ option_id: o.id })}
            className={tileClass(value?.option_id === o.id ? "selected" : "idle", "px-5 py-3 text-lg")}
          >
            <span className="sr-only">{i + 1}. </span>
            {o.text}
          </button>
        ))}
      </div>
    </div>
  );
}
