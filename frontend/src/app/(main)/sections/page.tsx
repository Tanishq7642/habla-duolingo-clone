"use client";

import clsx from "clsx";

import { DailyGoalCard } from "@/components/gamification/DailyGoalCard";
import { PageShell } from "@/components/layout/PageShell";
import { themeFor } from "@/components/path/theme";
import { ButtonLink } from "@/components/ui/Button";
import { CourseFlag } from "@/components/ui/CourseFlag";
import { ErrorState } from "@/components/ui/ErrorState";
import { Mascot } from "@/components/ui/Mascot";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePath } from "@/lib/queries";
import type { UnitNode } from "@/lib/types";

/** Course overview (Duolingo's "sections" page): every unit, its progress, and a jump to it. */
export default function SectionsPage() {
  const path = usePath();

  return (
    <PageShell rail={<DailyGoalCard />}>
      {path.isError && <ErrorState error={path.error} onRetry={() => path.refetch()} />}
      {path.isPending && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-44" />)}
        </div>
      )}
      {path.data && (
        <>
          <header className="mb-6 flex items-center gap-3">
            <CourseFlag course={path.data.course} size={36} />
            <h1 className="text-2xl font-black">{path.data.course.title}</h1>
          </header>
          <ol className="space-y-5">
            {path.data.units.map((unit) => (
              <UnitCard key={unit.id} unit={unit} />
            ))}
          </ol>
        </>
      )}
    </PageShell>
  );
}

function UnitCard({ unit }: { unit: UnitNode }) {
  const t = themeFor(unit.theme);
  const done = unit.skills.filter((s) => s.status === "completed").length;
  const total = unit.skills.length;
  const locked = unit.skills.every((s) => s.status === "locked");
  const label = locked ? "Locked" : done === total ? "Review" : done === 0 ? "Start" : "Continue";

  return (
    <li className={clsx("flex items-center gap-4 rounded-2xl p-5 text-white", locked ? "bg-ink-300" : t.banner)}>
      <div className="min-w-0 flex-1">
        <p className="text-[0.8rem] font-black uppercase tracking-[0.12em] opacity-80">Unit {unit.position}</p>
        <h2 className="text-[1.45rem] font-black leading-tight">{unit.title}</h2>
        <p className="mt-0.5 font-semibold opacity-90">{unit.description}</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/20" role="progressbar" aria-label={`${unit.title} progress`}
               aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
            <div className="h-full rounded-full bg-white transition-[width]" style={{ width: `${(done / total) * 100}%` }} />
          </div>
          <span className="shrink-0 text-sm font-black">{done}/{total}</span>
        </div>
        {locked ? (
          <p className="mt-4 text-sm font-black uppercase tracking-wide opacity-90">🔒 Locked</p>
        ) : (
          <ButtonLink href={`/#unit-section-${unit.id}`} variant="ghost" className={clsx("mt-4 !border-white !bg-white hover:!bg-[#F2F2F2]", t.text)}>
            {label}
          </ButtonLink>
        )}
      </div>
      <Mascot size={88} mood={done === total && !locked ? "cheer" : locked ? "think" : "happy"} className="hidden shrink-0 sm:block" />
    </li>
  );
}
