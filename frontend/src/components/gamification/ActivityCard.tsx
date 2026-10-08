"use client";

import clsx from "clsx";

import { Skeleton } from "@/components/ui/Skeleton";
import { useActivity, useLearner } from "@/lib/queries";

import { Card } from "./Card";

const weekday = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: "narrow" });

/** Learning momentum: last 7 days of XP plus recent sessions. */
export function ActivityCard() {
  const activity = useActivity();
  const { data: me } = useLearner();
  if (activity.isPending || !me) return <Skeleton className="h-56" />;
  if (activity.isError) return null;

  const { days, recent } = activity.data;
  const max = Math.max(...days.map((d) => Math.max(d.xp, d.goal_xp)), 1);
  const { active_days, window_days } = me.momentum;

  return (
    <Card title="Learning momentum">
      <p className="text-base font-bold text-ink-500">
        {active_days === 0
          ? "No activity this week yet – today's a great day to start."
          : `You learned on ${active_days} of the last ${window_days} days${active_days >= 5 ? " – unstoppable! 🚀" : "."}`}
      </p>
      <div className="mt-4 flex items-end justify-between gap-2" role="img" aria-label={`XP per day: ${days.map((d) => d.xp).join(", ")}`}>
        {days.map((d, i) => {
          const isToday = i === days.length - 1;
          const met = d.xp >= d.goal_xp;
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <div className="relative flex h-24 w-full items-end rounded-lg bg-ink-50">
                <div
                  className={clsx("w-full rounded-lg transition-[height] duration-700", met ? "bg-sun-500" : d.xp > 0 ? "bg-leaf-400" : "bg-transparent")}
                  style={{ height: `${(d.xp / max) * 100}%` }}
                />
              </div>
              <span className={clsx("text-sm font-black", isToday ? "text-ocean-800" : "text-ink-500")}>{weekday(d.date)}</span>
            </div>
          );
        })}
      </div>
      {recent.length > 0 && (
        <ul className="mt-5 space-y-2 border-t-2 border-ink-100 pt-4">
          {recent.slice(0, 3).map((r) => (
            <li key={r.attempt_id} className="flex items-center justify-between gap-2 text-base">
              <span className="truncate font-bold text-ink-700">
                {r.kind === "practice" ? "💪 " : "📘 "}
                {r.title}
                {r.mistakes === 0 && <span className="ml-1 text-xs text-sun-800" title="Perfect">★</span>}
              </span>
              <span className="shrink-0 font-black text-sun-800">+{r.xp} XP</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
