"use client";

import clsx from "clsx";
import { useState } from "react";

import type { Tile } from "@/lib/types";

import { tileClass, type ExerciseProps, type TileState } from "./shared";

type Side = "left" | "right";
const PAIR_COLORS = ["#2EA6F0", "#7C5CFF", "#FFB020", "#E64980", "#13B5A6", "#FF8A1F"];

/**
 * Tap one word on each side to pair them; tap a paired word to unpair.
 * The whole board is checked server-side once every word is paired, so the
 * answer key never reaches the browser.
 */
export function MatchPairs({ exercise, value, onChange, locked, result }: ExerciseProps<"match_pairs">) {
  const { left, right } = exercise.data;
  const pairs = value?.pairs ?? {};
  const [pending, setPending] = useState<{ side: Side; id: string } | null>(null);

  const pairIndex = (side: Side, id: string): number => {
    const entries = Object.entries(pairs);
    return entries.findIndex(([l, r]) => (side === "left" ? l === id : r === id));
  };
  const wrong = new Set(result?.detail?.wrong_left_ids ?? []);

  const commit = (next: Record<string, string>) =>
    onChange(Object.keys(next).length ? { pairs: next } : null);

  const tap = (side: Side, id: string) => {
    if (locked) return;
    const idx = pairIndex(side, id);
    if (idx >= 0) {
      // Unpair.
      const [l] = Object.entries(pairs)[idx];
      const next = { ...pairs };
      delete next[l];
      commit(next);
      setPending(null);
      return;
    }
    if (!pending || pending.side === side) {
      setPending({ side, id });
      return;
    }
    const [l, r] = side === "left" ? [id, pending.id] : [pending.id, id];
    commit({ ...pairs, [l]: r });
    setPending(null);
  };

  const stateFor = (side: Side, id: string): TileState => {
    const idx = pairIndex(side, id);
    if (result && idx >= 0) {
      const leftId = side === "left" ? id : Object.entries(pairs)[idx][0];
      return wrong.has(leftId) ? "wrong" : "correct";
    }
    if (pending?.side === side && pending.id === id) return "selected";
    return "idle";
  };

  const column = (side: Side, tiles: Tile[]) => (
    <ul className="flex flex-col gap-3" aria-label={side === "left" ? "Spanish words" : "English meanings"}>
      {tiles.map((t) => {
        const idx = pairIndex(side, t.id);
        const paired = idx >= 0;
        const color = PAIR_COLORS[idx % PAIR_COLORS.length];
        return (
          <li key={t.id}>
            <button
              type="button"
              disabled={locked}
              onClick={() => tap(side, t.id)}
              aria-pressed={paired || (pending?.side === side && pending.id === t.id)}
              aria-label={paired ? `${t.text}, pair ${idx + 1}. Tap to unpair.` : t.text}
              className={tileClass(stateFor(side, t.id), "relative flex w-full items-center justify-center px-3 py-4 text-lg")}
              style={paired && !result ? { borderColor: color, background: `${color}14` } : undefined}
            >
              {paired && (
                <span
                  aria-hidden
                  className={clsx("absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white", side === "right" && "left-auto right-2")}
                  style={{ background: result ? undefined : color }}
                >
                  {!result && idx + 1}
                </span>
              )}
              {t.text}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const pairedCount = Object.keys(pairs).length;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {column("left", left)}
        {column("right", right)}
      </div>
      <p className="text-center text-sm font-bold text-ink-400" aria-live="polite">
        {pairedCount} / {left.length} pairs matched
      </p>
    </div>
  );
}
