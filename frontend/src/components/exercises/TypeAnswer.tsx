"use client";

import clsx from "clsx";
import { useEffect, useRef } from "react";

import { SpeechBubble, type ExerciseProps } from "./shared";

const SPECIAL_CHARS = ["á", "é", "í", "ó", "ú", "ñ", "¿", "¡"];

export function TypeAnswer({ exercise, value, onChange, locked, result }: ExerciseProps<"type_answer">) {
  const { source_text, placeholder, answer_language } = exercise.data;
  const input = useRef<HTMLInputElement>(null);
  const text = value?.text ?? "";

  useEffect(() => input.current?.focus(), []);

  const set = (t: string) => onChange(t ? { text: t } : null);

  const insert = (ch: string) => {
    const el = input.current;
    if (!el) return;
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    set(text.slice(0, start) + ch + text.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + 1, start + 1);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {source_text && <SpeechBubble text={source_text} lang={answer_language === "es" ? "en" : "es"} />}
      <label className="sr-only" htmlFor={`answer-${exercise.id}`}>
        Your answer
      </label>
      <input
        id={`answer-${exercise.id}`}
        ref={input}
        value={text}
        disabled={locked}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        lang={answer_language}
        maxLength={200}
        className={clsx(
          "w-full rounded-2xl border-2 px-5 py-4 text-xl font-bold text-ink-900 outline-none transition",
          "placeholder:font-semibold placeholder:text-ink-300",
          // Exactly one colour set applies, so utilities never fight over specificity.
          !result && "border-ink-200 bg-ink-50 focus:border-ocean-400 focus:bg-white",
          result?.correct && "border-leaf-400 bg-leaf-50 text-leaf-800",
          result && !result.correct && "animate-shake border-coral-400 bg-coral-50 text-coral-700",
        )}
      />
      {answer_language === "es" && !locked && (
        <div className="flex flex-wrap gap-2" aria-label="Spanish characters">
          {SPECIAL_CHARS.map((ch) => (
            <button
              key={ch}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insert(ch)}
              className="h-10 w-10 rounded-xl border-2 border-b-4 border-ink-200 bg-white font-bold text-ink-700 active:translate-y-[2px] active:border-b-2"
              aria-label={`Insert ${ch}`}
            >
              {ch}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
