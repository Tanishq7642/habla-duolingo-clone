"use client";

import clsx from "clsx";
import { useEffect, useRef, type CSSProperties } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/Progress";
import type { SkillNode as Skill } from "@/lib/types";
import { rem } from "@/lib/units";
import { Mascot } from "@/components/ui/Mascot";

import { GOLD_CANDY, LOCKED_CANDY, themeFor } from "./theme";

interface Props {
  skill: Skill;
  theme: string;
  /** 1-based position along the whole course, shown on the level plaque. */
  level: number;
  offset: number;
  isCurrent: boolean;
  open: boolean;
  onToggle: () => void;
}

const STATUS_LABEL: Record<Skill["status"], string> = {
  locked: "Locked",
  available: "Start",
  in_progress: "In progress",
  completed: "Completed",
};

/** Crown level (0..cap) → 0-3 stars, Candy Crush style. */
export function starsFor(mastery: number, cap: number): number {
  if (mastery <= 0) return 0;
  if (mastery >= cap) return 3;
  return mastery >= Math.ceil(cap / 2) ? 2 : 1;
}

/**
 * One level on the path: a glossy "candy" button (colour = unit theme, gold once
 * completed, grey while locked), stars for its crown level and a numbered plaque.
 * The progress ring is only drawn around the level you're currently on.
 */
export function SkillNode({ skill, theme, level, offset, isCurrent, open, onToggle }: Props) {
  const t = themeFor(theme);
  const locked = skill.status === "locked";
  const completed = skill.status === "completed";
  const ratio = completed ? skill.mastery / skill.mastery_cap : skill.lessons_completed / skill.lessons_total;
  const candy = locked ? LOCKED_CANDY : completed ? GOLD_CANDY : t.candy;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [open]);

  return (
    <div ref={ref} className="relative flex flex-col items-center" style={{ transform: `translateX(${rem(offset)})` }}>
      {isCurrent && (
        // Pip keeps you company next to your current lesson, on the side with more room.
        <div className={clsx("absolute top-1/2 hidden -translate-y-1/2 sm:block", offset >= 0 ? "right-full mr-10" : "left-full ml-10")}>
          <Mascot size={104} interactive />
        </div>
      )}
      {isCurrent && !open && (
        <span className="absolute -top-11 z-10 animate-float rounded-xl border-2 border-ink-200 bg-surface px-3 py-1.5 text-sm font-black uppercase tracking-wide text-leaf-800 shadow-sm after:absolute after:-bottom-[7px] after:left-1/2 after:h-3 after:w-3 after:-translate-x-1/2 after:rotate-45 after:border-b-2 after:border-r-2 after:border-ink-200 after:bg-surface">
          {skill.status === "in_progress" ? "Continue" : "Start"}
        </span>
      )}
      <ProgressRing
        value={isCurrent ? ratio : 0}
        size={104}
        stroke={8}
        color={t.ring}
        track={isCurrent ? undefined : "transparent"}
        className={clsx(isCurrent && "rounded-full animate-pulse-ring")}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={`Level ${level}, ${skill.title}: ${STATUS_LABEL[skill.status]}, ${skill.lessons_completed} of ${skill.lessons_total} lessons, crown level ${skill.mastery} of ${skill.mastery_cap}`}
          data-trail-point
          data-trail-done={!locked || undefined}
          className={clsx(
            "candy flex h-[5rem] w-[5rem] items-center justify-center rounded-full text-4xl",
            locked && "candy-locked",
            isCurrent && !open && "candy-current",
          )}
          style={{ "--c-light": candy.light, "--c-base": candy.base, "--c-dark": candy.dark, "--c-edge": candy.edge } as CSSProperties}
        >
          <span aria-hidden className={clsx("relative drop-shadow-[0_2px_0_rgb(0_0_0/0.15)]", locked && "opacity-40 grayscale")}>{skill.icon}</span>
          {locked && (
            <span aria-hidden className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-ink-300 text-xs">
              🔒
            </span>
          )}
        </button>
        {completed && <LevelStars count={starsFor(skill.mastery, skill.mastery_cap)} />}
      </ProgressRing>
      <p
        className={clsx(
          "mt-2 flex items-center gap-1.5 rounded-full border-2 border-ink-200 bg-surface py-0.5 pl-0.5 pr-3 text-sm font-extrabold shadow-[0_2px_0_rgb(var(--ink-200))]",
          locked ? "text-ink-500" : "text-ink-700",
        )}
      >
        <span
          aria-hidden
          className="flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-black text-white"
          style={{ background: locked ? "rgb(var(--ink-300))" : candy.base }}
        >
          {level}
        </span>
        {skill.title}
      </p>
      {open && <SkillPopover skill={skill} theme={theme} />}
    </div>
  );
}

/** Three stars in an arc over the top of a finished level (earned ones gold). */
function LevelStars({ count }: { count: number }) {
  // left, middle, right: the middle star sits higher and is a bit bigger, like Candy Crush
  const slots = [
    { x: "-2.3rem", y: "0.55rem", size: "1.45rem", rot: "-18deg" },
    { x: "0rem", y: "0rem", size: "1.8rem", rot: "0deg" },
    { x: "2.3rem", y: "0.55rem", size: "1.45rem", rot: "18deg" },
  ];
  return (
    <span aria-hidden className="pointer-events-none absolute -top-1 left-1/2 h-0 w-0">
      {slots.map((s, i) => (
        <span
          key={i}
          className="absolute"
          style={{ left: s.x, top: s.y, width: s.size, height: s.size, translate: "-50% -50%", rotate: s.rot }}
        >
          <svg viewBox="0 0 24 24" className="level-star h-full w-full" style={{ animationDelay: `${i * 0.12}s` }}>
            <path
              d="M12 2.2l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 16.8 6.1 20l1.3-6.5L2.5 9l6.6-.8z"
              fill={i < count ? "#FFC800" : "rgb(var(--ink-200))"}
              stroke={i < count ? "#E09C00" : "rgb(var(--ink-300))"}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {i < count && <path d="M9.2 8.6l1.6-3.1" stroke="#FFF6C4" strokeWidth="1.6" strokeLinecap="round" />}
          </svg>
        </span>
      ))}
    </span>
  );
}

function SkillPopover({ skill, theme }: { skill: Skill; theme: string }) {
  const t = themeFor(theme);
  const locked = skill.status === "locked";
  const completed = skill.status === "completed";
  const nextLesson = skill.lessons.find((l) => l.id === skill.next_lesson_id);

  return (
    <div
      role="dialog"
      aria-label={`${skill.title} details`}
      className={clsx(
        "absolute top-full z-20 mt-3 w-72 animate-pop rounded-3xl border-b-[6px] p-5 text-white shadow-xl",
        locked ? "border-ink-300 bg-ink-200 !text-ink-500" : completed ? "border-sun-600 bg-sun-500" : t.banner,
      )}
    >
      <h3 className="text-xl font-black">{skill.title}</h3>
      <p className="text-sm font-semibold opacity-90">{skill.description}</p>

      <ol className="mt-3 flex gap-1.5" aria-label="Lessons">
        {skill.lessons.map((l) => (
          <li
            key={l.id}
            title={`Lesson ${l.position}: ${l.title}`}
            className={clsx(
              "h-2.5 flex-1 rounded-full",
              l.status === "completed" ? "bg-white" : "bg-white/35", // white in both themes, like Duolingo
            )}
          >
            <span className="sr-only">Lesson {l.position} {l.title}: {l.status}</span>
          </li>
        ))}
      </ol>

      {locked ? (
        <p className="mt-4 text-sm font-bold">Complete the skill before this one to unlock it.</p>
      ) : (
        <>
          <p className="mt-3 text-sm font-bold opacity-90">
            {completed
              ? `Crown level ${skill.mastery}/${skill.mastery_cap} – replay to level up`
              : `Lesson ${nextLesson?.position ?? 1} of ${skill.lessons_total}: ${nextLesson?.title ?? ""}`}
          </p>
          {skill.next_lesson_id && (
            <ButtonLink
              href={`/lesson/${skill.next_lesson_id}`}
              variant="ghost"
              block
              // Always a white button on the coloured popover (not theme-dependent), text in the unit colour.
              className={clsx("mt-4 !border-white !bg-white hover:!bg-[#F2F2F2]", completed ? "!text-sun-600" : t.text)}
            >
              {completed ? (skill.mastery >= skill.mastery_cap ? "Review" : "Level up") : skill.status === "in_progress" ? "Continue" : "Start"}
            </ButtonLink>
          )}
        </>
      )}
    </div>
  );
}
