"use client";

import clsx from "clsx";

import { Button } from "@/components/ui/Button";
import type { ApiError } from "@/lib/api";
import type { AnswerResult } from "@/lib/types";

const PRAISE = ["Nicely done!", "Excellent!", "You got it!", "Great job!", "Amazing!", "Perfect!"];

interface Props {
  phase: "answering" | "checking" | "feedback" | "completing";
  ready: boolean;
  result: AnswerResult | null;
  error: ApiError | null;
  combo: number;
  turn: number;
  onCheck: () => void;
  onContinue: () => void;
  onRetryComplete: () => void;
}

/** Sticky bottom bar: Check → (correct | incorrect) feedback → Continue. */
export function FeedbackBar({ phase, ready, result, error, combo, turn, onCheck, onContinue, onRetryComplete }: Props) {
  if (phase === "completing") {
    return (
      <Bar tone="neutral">
        {error ? (
          <>
            <div role="alert" className="flex-1">
              <p className="font-extrabold text-coral-800">We couldn't save your lesson yet</p>
              <p className="text-sm text-ink-500">Your answers are safe on the server. Retrying is safe – you won't get double XP.</p>
            </div>
            <Button onClick={onRetryComplete} className="sm:w-44">Retry</Button>
          </>
        ) : (
          <>
            <p className="flex-1 font-bold text-ink-500">Saving your progress…</p>
            <Button loading className="sm:w-44">Continue</Button>
          </>
        )}
      </Bar>
    );
  }

  if (phase === "feedback" && result) {
    const good = result.correct;
    return (
      <Bar tone={good ? "good" : "bad"}>
        <div className="flex flex-1 items-start gap-4" role="status" aria-live="assertive">
          <span
            aria-hidden
            className={clsx(
              "hidden h-16 w-16 shrink-0 animate-pop items-center justify-center rounded-full bg-surface text-3xl font-black sm:flex",
              good ? "text-leaf-800" : "text-coral-800",
            )}
          >
            {good ? "✓" : "✕"}
          </span>
          <div className="min-w-0">
            <p className={clsx("text-2xl font-black", good ? "text-leaf-800" : "text-coral-800")}>
              {good ? PRAISE[turn % PRAISE.length] : "Not quite"}
            </p>
            {good && combo >= 3 && <p className="font-bold text-leaf-800">🔥 {combo} correct in a row</p>}
            {result.note && <p className="font-bold text-sun-800">{result.note}</p>}
            {!good && (
              <p className="mt-1 font-bold text-coral-800">
                Correct answer: <span className="font-extrabold">{result.correct_answer}</span>
              </p>
            )}
            {!good && result.explanation && <p className="mt-1 text-sm text-coral-800">{result.explanation}</p>}
            {!good && result.requeued && !result.out_of_hearts && (
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-coral-800">You'll see this one again</p>
            )}
          </div>
        </div>
        {good && result.xp_earned > 0 && (
          <span key={turn} aria-hidden className="pointer-events-none absolute right-10 top-0 animate-fly-up text-xl font-black text-sun-800 [--fly-x:0px] [--fly-y:-120px]">
            +{result.xp_earned} XP
          </span>
        )}
        <Button autoFocus variant={good ? "primary" : "danger"} onClick={onContinue} className="sm:w-44">
          Continue
        </Button>
      </Bar>
    );
  }

  return (
    <Bar tone="neutral">
      <div className="flex-1" aria-live="polite">
        {error && (
          <p role="alert" className="text-sm font-bold text-coral-800">
            {error.isNetwork ? "Connection lost." : error.message} Your answer is kept – press Check to try again.
          </p>
        )}
      </div>
      <Button disabled={!ready} loading={phase === "checking"} onClick={onCheck} className="sm:w-44">
        Check
      </Button>
    </Bar>
  );
}

function Bar({ tone, children }: { tone: "neutral" | "good" | "bad"; children: React.ReactNode }) {
  return (
    <div
      className={clsx(
        "relative border-t-2 transition-colors",
        tone === "neutral" && "border-ink-100 bg-surface",
        tone === "good" && "animate-slide-up border-transparent bg-leaf-100",
        tone === "bad" && "animate-slide-up border-transparent bg-coral-100",
      )}
    >
      <div className="mx-auto flex min-h-[8rem] w-full max-w-4xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:px-6 [&>button]:w-full sm:[&>button]:w-44">
        {children}
      </div>
    </div>
  );
}
