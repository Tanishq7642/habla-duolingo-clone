"use client";

import clsx from "clsx";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { HeartIcon } from "@/components/lesson/LessonHeader";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CourseFlag } from "@/components/ui/CourseFlag";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useLearner, useRefillHearts } from "@/lib/queries";

/** 🔥 streak · 💎 gems · ❤️ hearts · ⚡ XP – each opens a popover explaining the metric. */
/** `lg` is the desktop right rail (Duolingo-sized); `md` fits the phone header. */
export function TopStats({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  const icon = size === "lg" ? "text-[1.75rem]" : "text-2xl";
  const heart = size === "lg" ? "h-7 w-7" : "h-6 w-6";
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
        large={size === "lg"}
        label={`${me.streak.current} day streak`}
        trigger={
          <>
            <span className={clsx(icon, !streakOn && "grayscale")} aria-hidden>🔥</span>
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
        large={size === "lg"}
        label={`${me.gems} gems`}
        trigger={
          <>
            <span className={icon} aria-hidden>💎</span>
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
        large={size === "lg"}
        label={`${me.hearts} of ${me.max_hearts} hearts`}
        trigger={
          <>
            <HeartIcon className={clsx(heart, me.hearts ? "text-coral-500" : "text-ink-200")} />
            <span className={me.hearts ? "text-coral-800" : "text-ink-500"}>{me.hearts}</span>
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
        large={size === "lg"}
        label={`${me.total_xp} total XP`}
        trigger={
          <>
            <span className={icon} aria-hidden>⚡</span>
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

const POPOVER_WIDTH = 288; // px
const EDGE = 16;

/**
 * A stat button plus its info card. The card is rendered in a portal on <body>
 * with fixed positioning under the button: the stats live inside sticky bars
 * (rail / phone header), and anything inside those would be clipped by them or
 * hidden under the pinned unit banner.
 */
function StatPopover({ label, trigger, children, large }: { label: string; trigger: ReactNode; children: ReactNode; large?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLDivElement>(null);

  // Place the card under the button, kept inside the viewport; follow scroll/resize.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = button.current?.getBoundingClientRect();
      if (!r) return;
      const width = Math.min(POPOVER_WIDTH, window.innerWidth - EDGE * 2);
      const centred = r.left + r.width / 2 - width / 2;
      const left = Math.max(EDGE, Math.min(centred, window.innerWidth - width - EDGE));
      setPos({ top: r.bottom + 8, left, width });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  // Close on outside click / Escape (the card is outside the button's DOM tree, so check both).
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === "Escape") setOpen(false);
        return;
      }
      const target = e.target as Node;
      if (!button.current?.contains(target) && !card.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={clsx("flex items-center gap-1.5 rounded-xl px-1.5 py-1.5 font-black tabular-nums transition hover:bg-ink-50", large ? "text-xl" : "text-lg")}
      >
        {trigger}
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={card}
            role="dialog"
            aria-label={label}
            className="fixed z-50 animate-pop rounded-3xl border-2 border-ink-100 bg-surface-raised p-5 shadow-xl"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
  );
}
