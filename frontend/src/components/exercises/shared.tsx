"use client";

import clsx from "clsx";
import { useEffect, type ReactNode } from "react";

import { Mascot } from "@/components/ui/Mascot";
import { SpeakButton } from "@/components/ui/SpeakButton";
import type { AnswerMap, AnswerResult, Exercise, ExerciseType } from "@/lib/types";

/** Contract every exercise renderer implements. */
export interface ExerciseProps<T extends ExerciseType> {
  exercise: Exercise<T>;
  value: AnswerMap[T] | null;
  onChange: (value: AnswerMap[T] | null) => void;
  /** True once the answer is being checked or has been checked. */
  locked: boolean;
  result: AnswerResult | null;
}

export type TileState = "idle" | "selected" | "correct" | "wrong" | "used";

const tileStyles: Record<TileState, string> = {
  idle: "border-ink-200 bg-white text-ink-900 hover:bg-ink-50",
  selected: "border-ocean-400 bg-ocean-50 text-ocean-800",
  correct: "border-leaf-400 bg-leaf-50 text-leaf-800",
  wrong: "border-coral-400 bg-coral-50 text-coral-700 animate-shake",
  used: "border-ink-100 bg-ink-100 text-transparent",
};

export function tileClass(state: TileState, extra?: string) {
  return clsx(
    "rounded-2xl border-2 border-b-4 font-bold transition-[transform,background-color,border-color] duration-100",
    "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-ocean-400",
    state !== "used" && "active:translate-y-[2px] active:border-b-2",
    tileStyles[state],
    extra,
  );
}

/** Number keys 1..n pick options – a big speed-up for keyboard learners. */
export function useNumberKeys(count: number, onPick: (index: number) => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= count) onPick(n - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [count, onPick, enabled]);
}

/** Mascot with a speech bubble holding the source sentence. */
export function SpeechBubble({ text, lang, children }: { text: string; lang: string; children?: ReactNode }) {
  return (
    <div className="flex items-end gap-3">
      <Mascot size={88} mood="think" className="hidden shrink-0 sm:block" />
      <div className="relative flex items-center gap-3 rounded-3xl border-2 border-ink-200 bg-white px-4 py-3 sm:before:absolute sm:before:-left-[9px] sm:before:bottom-6 sm:before:h-4 sm:before:w-4 sm:before:rotate-45 sm:before:border-b-2 sm:before:border-l-2 sm:before:border-ink-200 sm:before:bg-white">
        <SpeakButton text={text} lang={lang} className="!h-9 !w-9" />
        <p className="text-lg font-bold text-ink-900">{text}</p>
        {children}
      </div>
    </div>
  );
}
