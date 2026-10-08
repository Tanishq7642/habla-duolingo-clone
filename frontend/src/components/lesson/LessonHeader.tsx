"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import { ProgressBar } from "@/components/ui/Progress";

interface Props {
  progress: number;
  hearts: number | null; // null = practice (hearts not at stake)
  combo: number;
  onExit: () => void;
}

export function LessonHeader({ progress, hearts, combo, onExit }: Props) {
  return (
    <header className="mx-auto flex w-full max-w-4xl items-center gap-4 px-4 pt-6 sm:px-6">
      <button
        type="button"
        onClick={onExit}
        aria-label="Quit lesson"
        className="rounded-xl p-2 text-ink-300 transition hover:bg-ink-100 hover:text-ink-500"
      >
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </button>
      <div className="relative flex-1">
        <ProgressBar value={progress} label="Lesson progress" />
        {combo >= 3 && (
          <span key={combo} className="absolute -top-6 left-1/2 -translate-x-1/2 animate-pop whitespace-nowrap text-xs font-black uppercase tracking-wider text-flame-500">
            {combo} in a row!
          </span>
        )}
      </div>
      {hearts === null ? (
        <span className="rounded-xl bg-grape-50 px-3 py-1 text-sm font-extrabold text-grape-600">Practice</span>
      ) : (
        <HeartCounter hearts={hearts} />
      )}
    </header>
  );
}

function HeartCounter({ hearts }: { hearts: number }) {
  const prev = useRef(hearts);
  const [lost, setLost] = useState(0);
  useEffect(() => {
    if (hearts < prev.current) setLost((n) => n + 1);
    prev.current = hearts;
  }, [hearts]);

  return (
    <div className="relative flex items-center gap-1.5" aria-label={`${hearts} hearts left`} role="status">
      <HeartIcon className={clsx("h-7 w-7", hearts === 0 ? "text-ink-200" : "text-coral-500")} />
      <span className={clsx("text-lg font-black tabular-nums", hearts === 0 ? "text-ink-300" : "text-coral-500")}>{hearts}</span>
      {lost > 0 && (
        <HeartIcon key={lost} className="pointer-events-none absolute left-0 top-0 h-7 w-7 animate-heart-loss text-coral-500" />
      )}
    </div>
  );
}

export function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 4.2 2.4h2c.6-1.3 2.1-2.4 4.2-2.4 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" />
      <ellipse cx="7.5" cy="9" rx="2" ry="1.3" fill="#fff" opacity=".45" transform="rotate(-30 7.5 9)" />
    </svg>
  );
}
