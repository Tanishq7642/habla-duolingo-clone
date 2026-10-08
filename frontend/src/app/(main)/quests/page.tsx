"use client";

import clsx from "clsx";

import { DailyGoalCard } from "@/components/gamification/DailyGoalCard";
import { PageShell } from "@/components/layout/PageShell";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProgressBar } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { useActivity, useLearner } from "@/lib/queries";

/**
 * Daily quests derived from data the backend already tracks (today's XP,
 * lessons and streak) – no separate quest tables needed for this slice.
 */
export default function QuestsPage() {
  const me = useLearner();
  const activity = useActivity();

  if (me.isError) return <PageShell><ErrorState error={me.error} onRetry={() => me.refetch()} /></PageShell>;
  if (!me.data || !activity.data) return <PageShell><Skeleton className="h-96" /></PageShell>;

  const today = activity.data.days[activity.data.days.length - 1];
  const quests = [
    { icon: "⚡", title: `Earn ${me.data.daily_goal.goal_xp} XP`, value: me.data.daily_goal.xp_today, target: me.data.daily_goal.goal_xp },
    { icon: "📘", title: "Complete 2 lessons", value: today?.lessons ?? 0, target: 2 },
    { icon: "🔥", title: "Extend your streak", value: me.data.streak.extended_today ? 1 : 0, target: 1 },
  ];

  return (
    <PageShell rail={<DailyGoalCard />}>
      <header data-brand-surface className="rounded-3xl bg-gradient-to-br from-grape-500 to-ocean-500 p-6 text-white">
        <h1 className="text-3xl font-black">Daily Quests</h1>
        <p className="mt-1 font-bold opacity-90">Complete quests to stay on track. They reset at your local midnight.</p>
      </header>

      <ul className="mt-6 space-y-3">
        {quests.map((q) => {
          const done = q.value >= q.target;
          return (
            <li key={q.title} className={clsx("flex items-center gap-4 rounded-2xl border-2 p-4", done ? "border-sun-400 bg-sun-50" : "border-ink-200")}>
              <span className="text-3xl" aria-hidden>{q.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">{q.title}</p>
                <div className="mt-2 flex items-center gap-3">
                  <ProgressBar value={q.value / q.target} color="sun" label={q.title} />
                  <span className="shrink-0 text-sm font-black text-ink-500">{Math.min(q.value, q.target)}/{q.target}</span>
                </div>
              </div>
              <span className="text-2xl" aria-label={done ? "Completed" : "Not completed"}>{done ? "🎁" : "📦"}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-8">
        <ComingSoon icon="🤝" title="Friends Quests" body="Team up with a friend to complete weekly challenges." />
      </div>
    </PageShell>
  );
}
