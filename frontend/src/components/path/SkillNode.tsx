"use client";

import clsx from "clsx";
import { useEffect, useRef } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { CrownBadge } from "@/components/ui/Crown";
import { ProgressRing } from "@/components/ui/Progress";
import type { SkillNode as Skill } from "@/lib/types";

import { themeFor } from "./theme";

interface Props {
  skill: Skill;
  theme: string;
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

export function SkillNode({ skill, theme, offset, isCurrent, open, onToggle }: Props) {
  const t = themeFor(theme);
  const locked = skill.status === "locked";
  const completed = skill.status === "completed";
  const ratio = completed ? skill.mastery / skill.mastery_cap : skill.lessons_completed / skill.lessons_total;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [open]);

  return (
    <div ref={ref} className="relative flex flex-col items-center" style={{ transform: `translateX(${offset}px)` }}>
      {isCurrent && !open && (
        <span className="absolute -top-11 z-10 animate-float rounded-xl border-2 border-ink-200 bg-surface px-3 py-1.5 text-sm font-black uppercase tracking-wide text-leaf-800 shadow-sm after:absolute after:-bottom-[7px] after:left-1/2 after:h-3 after:w-3 after:-translate-x-1/2 after:rotate-45 after:border-b-2 after:border-r-2 after:border-ink-200 after:bg-surface">
          {skill.status === "in_progress" ? "Continue" : "Start"}
        </span>
      )}
      <ProgressRing
        value={locked ? 0 : ratio}
        size={104}
        stroke={8}
        color={completed ? "#FFC800" : t.ring}
        className={clsx(isCurrent && "rounded-full animate-pulse-ring")}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={`${skill.title}: ${STATUS_LABEL[skill.status]}, ${skill.lessons_completed} of ${skill.lessons_total} lessons`}
          className={clsx(
            "flex h-[76px] w-[76px] items-center justify-center rounded-full border-b-[6px] text-4xl transition-transform duration-75",
            "active:translate-y-[3px] active:border-b-[3px]",
            locked && "border-ink-300 bg-ink-200 grayscale",
            completed && "border-sun-600 bg-sun-500",
            !locked && !completed && t.node,
          )}
        >
          <span aria-hidden className={clsx(locked && "opacity-40")}>{skill.icon}</span>
          {locked && (
            <span aria-hidden className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-ink-300 text-xs">
              🔒
            </span>
          )}
        </button>
        {!locked && <CrownBadge level={skill.mastery} max={skill.mastery_cap} className="absolute -bottom-1 -right-1" />}
      </ProgressRing>
      <p className={clsx("mt-1 text-sm font-extrabold", locked ? "text-ink-500" : "text-ink-700")}>{skill.title}</p>
      {open && <SkillPopover skill={skill} theme={theme} />}
    </div>
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
      data-brand-surface
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
              l.status === "completed" ? "bg-surface" : "bg-white/35",
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
              className={clsx("mt-4 !border-white", completed ? "!text-sun-800" : t.text)}
            >
              {completed ? (skill.mastery >= skill.mastery_cap ? "Review" : "Level up") : skill.status === "in_progress" ? "Continue" : "Start"}
            </ButtonLink>
          )}
        </>
      )}
    </div>
  );
}
