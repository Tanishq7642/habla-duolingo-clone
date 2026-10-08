"use client";

import clsx from "clsx";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { HeartIcon } from "@/components/lesson/LessonHeader";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CourseFlag } from "@/components/ui/CourseFlag";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useLearner, useRefillHearts } from "@/lib/queries";

/** 🔥 streak · 💎 gems · ❤️ hearts · ⚡ XP – each opens a popover explaining the metric. */
export function TopStats({ className }: { className?: string }) {
  const { data: me, isPending } = useLearner();
  const refill = useRefillHearts();
  const toast = useToast();

  if (isPending || !me) {
    return (
      <div className={clsx("flex items-center gap-3", className)}>
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-16" />)}
      </div>
    );
  }

  const streakOn = me.streak.extended_today;
  return (
    <div className={clsx("flex items-center justify-between gap-1 sm:gap-3", className)}>
      {me.course && (
        <span className="mr-auto flex items-center rounded-xl px-2" title={me.course.title}>
          <CourseFlag course={me.course} />
          <span className="sr-only">Learning {me.course.language}</span>
        </span>
      )}
      <StatPopover
        label={`${me.streak.current} day streak`}
        trigger={
          <>
            <span className={clsx("text-2xl", !streakOn && "grayscale")} aria-hidden>🔥</span>
            <span className={streakOn ? "text-flame-800" : "text-ink-500"}>{me.streak.current}</span>
          </>
        }
      >
        <h3 className="text-lg font-black">{me.streak.current} day streak</h3>
        <p className="mt-1 text-sm text-ink-500">
          {streakOn
            ? "You've practised today. Come back tomorrow to keep the flame alive!"
            : me.streak.current > 0
              ? "Complete a lesson today or your streak resets at midnight."
              : "Complete a lesson to start a new streak."}
        </p>
        <p className="mt-2 text-xs font-bold text-ink-500">Longest streak: {me.streak.longest} days</p>
      </StatPopover>

      <StatPopover
        label={`${me.gems} gems`}
        trigger={
          <>
            <span className="text-2xl" aria-hidden>💎</span>
            <span className="text-gem-800"><AnimatedNumber value={me.gems} /></span>
          </>
        }
      >
        <h3 className="text-lg font-black">Gems</h3>
        <p className="mt-1 text-sm text-ink-500">
          Earn gems by finishing lessons (more for perfect ones). Spend them to refill hearts.
        </p>
      </StatPopover>

      <StatPopover
        label={`${me.hearts} of ${me.max_hearts} hearts`}
        trigger={
          <>
            <HeartIcon className={clsx("h-6 w-6", me.hearts ? "text-coral-500" : "text-ink-200")} />
            <span className={me.hearts ? "text-coral-700" : "text-ink-500"}>{me.hearts}</span>
          </>
        }
      >
        <h3 className="text-lg font-black">Hearts</h3>
        <div className="mt-2 flex gap-1" aria-hidden>
          {Array.from({ length: me.max_hearts }, (_, i) => (
            <HeartIcon key={i} className={clsx("h-7 w-7", i < me.hearts ? "text-coral-500" : "text-ink-200")} />
          ))}
        </div>
        <p className="mt-2 text-sm text-ink-500">
          You lose a heart for each mistake in a lesson. Practice sessions never cost hearts and earn one back.
        </p>
        {me.hearts < me.max_hearts && (
          <div className="mt-3 flex flex-col gap-2">
            <ButtonLink href="/practice" size="sm" variant="secondary" block>Practice +1 ❤️</ButtonLink>
            <Button
              size="sm"
              variant="sun"
              block
              disabled={me.gems < me.heart_refill_cost}
              loading={refill.isPending}
              onClick={() => refill.mutate(undefined, { onSuccess: () => toast("Hearts refilled!", { tone: "success", icon: "❤️" }) })}
            >
              Refill · 💎 {me.heart_refill_cost}
            </Button>
          </div>
        )}
      </StatPopover>

      <StatPopover
        label={`${me.total_xp} total XP`}
        trigger={
          <>
            <span className="text-2xl" aria-hidden>⚡</span>
            <span className="text-sun-800"><AnimatedNumber value={me.total_xp} /></span>
          </>
        }
      >
        <h3 className="text-lg font-black">Level {me.level.level}</h3>
        <p className="mt-1 text-sm text-ink-500">
          {me.level.xp_for_next_level - me.level.xp_into_level} XP to level {me.level.level + 1}. Every exercise gives XP; finishing a
          lesson adds a bonus.
        </p>
      </StatPopover>
    </div>
  );
}

function StatPopover({ label, trigger, children }: { label: string; trigger: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-xl px-1.5 py-1.5 text-lg font-black tabular-nums transition hover:bg-ink-50"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute right-0 top-full z-40 mt-2 w-72 animate-pop max-sm:fixed max-sm:inset-x-4 max-sm:top-16 max-sm:w-auto rounded-3xl border-2 border-ink-100 bg-white p-5 shadow-xl"
        >
          {children}
        </div>
      )}
    </div>
  );
}
