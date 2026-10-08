"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { Mascot } from "@/components/ui/Mascot";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePath } from "@/lib/queries";
import type { LearningPath as Path, UnitNode } from "@/lib/types";
import { rem } from "@/lib/units";

import { SkillNode } from "./SkillNode";
import { TRAIL_OFFSETS, themeFor } from "./theme";

/** The first skill the learner can act on (in progress, else first available). */
export function currentSkillId(path: Path): number | null {
  const skills = path.units.flatMap((u) => u.skills);
  return (
    skills.find((s) => s.status === "in_progress")?.id ??
    skills.find((s) => s.status === "available")?.id ??
    null
  );
}

export function LearningPath() {
  const { data, isPending, isError, error, refetch, isRefetching } = usePath();
  const [openSkill, setOpenSkill] = useState<number | null>(null);

  // Close the popover on outside click / Escape.
  useEffect(() => {
    if (openSkill === null) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !(e.target as HTMLElement).closest("[data-skill-node]")) {
        setOpenSkill(null);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [openSkill]);

  if (isPending) return <PathSkeleton />;
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} retrying={isRefetching} />;

  const current = currentSkillId(data);
  let index = 0; // trail offset continues across units
  return (
    <div className="flex flex-col gap-10 pb-10">
      {data.units.map((unit) => (
        <section key={unit.id} aria-labelledby={`unit-${unit.id}`}>
          <UnitBanner unit={unit} />
          <ol className="relative mt-16 flex flex-col items-center gap-16">
            {unit.skills.map((skill) => {
              const offset = TRAIL_OFFSETS[index++ % TRAIL_OFFSETS.length];
              return (
                <li key={skill.id} data-skill-node className={clsx(openSkill === skill.id && "z-20")}>
                  <SkillNode
                    skill={skill}
                    theme={unit.theme}
                    offset={offset}
                    isCurrent={skill.id === current}
                    open={openSkill === skill.id}
                    onToggle={() => setOpenSkill((s) => (s === skill.id ? null : skill.id))}
                  />
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <div className="flex flex-col items-center gap-2 pt-4 text-center">
        <Mascot mood="think" size={90} />
        <p className="font-extrabold text-ink-500">More units are on the way!</p>
      </div>
    </div>
  );
}

function UnitBanner({ unit }: { unit: UnitNode }) {
  const t = themeFor(unit.theme);
  const done = unit.skills.filter((s) => s.status === "completed").length;
  return (
    <header data-brand-surface className={clsx("flex items-center justify-between gap-4 rounded-3xl border-b-[6px] px-5 py-4 text-white", t.banner)}>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.15em] opacity-85">Unit {unit.position}</p>
        <h2 id={`unit-${unit.id}`} className="text-2xl font-black">{unit.title}</h2>
        <p className="font-semibold opacity-90">{unit.description}</p>
      </div>
      <div className="shrink-0 rounded-2xl bg-white/20 px-3 py-2 text-center">
        <p className="text-xl font-black">{done}/{unit.skills.length}</p>
        <p className="text-[0.625rem] font-black uppercase tracking-wider opacity-90">skills</p>
      </div>
    </header>
  );
}

function PathSkeleton() {
  return (
    <div className="flex flex-col gap-10" aria-busy="true" aria-label="Loading your learning path">
      <Skeleton className="h-28 w-full" />
      {TRAIL_OFFSETS.slice(0, 5).map((x, i) => (
        <div key={i} className="flex justify-center" style={{ transform: `translateX(${rem(x)})` }}>
          <Skeleton className="h-[5.75rem] w-[5.75rem] rounded-full" />
        </div>
      ))}
    </div>
  );
}
