"use client";

import clsx from "clsx";

import { SpeechBubble, tileClass, type ExerciseProps } from "./shared";

/** Build a sentence by tapping tiles. Tap a placed tile to send it back; order = tap order. */
export function WordBank({ exercise, value, onChange, locked, result }: ExerciseProps<"word_bank">) {
  const { source_text, tiles } = exercise.data;
  const placed = value?.tile_ids ?? [];
  const byId = new Map(tiles.map((t) => [t.id, t]));

  const set = (ids: string[]) => onChange(ids.length ? { tile_ids: ids } : null);
  const add = (id: string) => !locked && !placed.includes(id) && set([...placed, id]);
  const remove = (id: string) => !locked && set(placed.filter((x) => x !== id));

  const answerState = result ? (result.correct ? "border-leaf-300" : "border-coral-300") : "border-ink-200";

  return (
    <div className="flex flex-col gap-6">
      <SpeechBubble text={source_text} lang="en" />

      <div
        aria-label="Your answer"
        aria-live="polite"
        className={clsx(
          "flex min-h-[7.5rem] flex-wrap content-start gap-2 border-y-2 py-3 transition-colors",
          "bg-[repeating-linear-gradient(transparent,transparent_3.6rem,#DCE3EB_3.6rem,#DCE3EB_3.75rem)]",
          answerState,
          result && !result.correct && "animate-shake",
        )}
      >
        {placed.length === 0 && <span className="self-center px-1 text-ink-400">Tap the words below</span>}
        {placed.map((id) => (
          <button
            key={id}
            type="button"
            disabled={locked}
            onClick={() => remove(id)}
            aria-label={`Remove ${byId.get(id)?.text}`}
            className={tileClass("idle", "animate-pop px-4 py-2 text-lg")}
          >
            {byId.get(id)?.text}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2" aria-label="Word bank">
        {tiles.map((t) => {
          const used = placed.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              disabled={locked || used}
              onClick={() => add(t.id)}
              aria-label={used ? `${t.text} (used)` : `Add ${t.text}`}
              className={tileClass(used ? "used" : "idle", "px-4 py-2 text-lg")}
            >
              {t.text}
            </button>
          );
        })}
      </div>

      {placed.length > 0 && !locked && (
        <button type="button" onClick={() => set([])} className="self-center text-sm font-extrabold uppercase tracking-wide text-ink-400 hover:text-ink-700">
          Reset
        </button>
      )}
    </div>
  );
}
