import clsx from "clsx";

import { ProgressBar } from "@/components/ui/Progress";
import type { Achievement } from "@/lib/types";

export function AchievementGrid({ achievements }: { achievements: Achievement[] }) {
  const unlocked = achievements.filter((a) => a.unlocked_at).length;
  return (
    <section aria-labelledby="achievements-title">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 id="achievements-title" className="text-2xl font-black">Achievements</h2>
        <span className="font-black text-ink-400">{unlocked}/{achievements.length}</span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {achievements.map((a) => <AchievementCard key={a.code} achievement={a} />)}
      </ul>
    </section>
  );
}

export function AchievementCard({ achievement: a }: { achievement: Achievement }) {
  const done = !!a.unlocked_at;
  return (
    <li className={clsx("flex items-center gap-4 rounded-2xl border-2 p-4", done ? "border-sun-400 bg-sun-50" : "border-ink-100")}>
      <span
        aria-hidden
        className={clsx(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-b-4 text-3xl",
          done ? "border-sun-600 bg-sun-500" : "border-ink-200 bg-ink-100 grayscale",
        )}
      >
        {a.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className={clsx("font-black", !done && "text-ink-500")}>
          {a.title}
          <span className="sr-only">{done ? " (unlocked)" : " (locked)"}</span>
        </p>
        <p className="text-sm text-ink-500">{a.description}</p>
        {done ? (
          <p className="mt-1 text-xs font-bold text-sun-600">
            Unlocked {new Date(a.unlocked_at!).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </p>
        ) : (
          <div className="mt-2 flex items-center gap-2">
            <ProgressBar value={a.progress / a.threshold} color="sun" className="!h-2.5" label={`${a.title} progress`} />
            <span className="shrink-0 text-xs font-black text-ink-400">{a.progress}/{a.threshold}</span>
          </div>
        )}
      </div>
    </li>
  );
}
