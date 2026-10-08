"use client";

import clsx from "clsx";
import Link from "next/link";

import { Mascot } from "@/components/ui/Mascot";
import { ProgressBar } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLearner } from "@/lib/queries";

import { Card } from "./Card";

export function DailyGoalCard() {
  const { data: me } = useLearner();
  if (!me) return <Skeleton className="h-36" />;
  const { goal_xp, xp_today, reached } = me.daily_goal;

  return (
    <Card
      title="Daily goal"
      action={<Link href="/settings" className="text-sm font-extrabold uppercase text-ocean-500 hover:text-ocean-600">Edit</Link>}
      className={clsx(reached && "border-sun-400 bg-sun-50")}
    >
      <div className="flex items-center gap-4">
        <Mascot size={64} mood={reached ? "cheer" : "happy"} className={clsx(reached && "animate-float")} />
        <div className="flex-1">
          <p className="font-extrabold text-ink-700">
            {reached ? "Goal reached – nicely done! 🎉" : `Earn ${goal_xp - xp_today} more XP today`}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <ProgressBar value={xp_today / goal_xp} color="sun" label="Daily XP goal" />
            <span className="shrink-0 text-sm font-black tabular-nums text-ink-500">
              {xp_today}/{goal_xp}
            </span>
          </div>
        </div>
      </div>
      {me.streak.at_risk && (
        <p className="mt-4 rounded-2xl bg-flame-50 px-4 py-2 text-sm font-bold text-flame-600">
          🔥 Your {me.streak.current}-day streak ends at midnight – one lesson keeps it alive.
        </p>
      )}
    </Card>
  );
}
