"use client";

import clsx from "clsx";
import { Fragment, useState } from "react";

import { DailyGoalCard } from "@/components/gamification/DailyGoalCard";
import { LEAGUES, LeagueBadge } from "@/components/gamification/LeagueBadge";
import { PageShell } from "@/components/layout/PageShell";
import { Avatar } from "@/components/ui/Avatar";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLeaderboard } from "@/lib/queries";
import type { LeaderboardEntry } from "@/lib/types";

const MEDALS = ["🥇", "🥈", "🥉"];
// Duolingo-style weekly league zones. Presentation only: there is no league-promotion
// backend; ranks and XP are real.
const PROMOTE = 3;
const DEMOTE = 2;
const CURRENT_LEAGUE = LEAGUES[0];
const PERIODS = [
  { id: "week", label: "This week" },
  { id: "all", label: "All time" },
] as const;

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<"week" | "all">("week");
  const board = useLeaderboard(period);

  return (
    <PageShell rail={<DailyGoalCard />}>
      <header className="flex flex-col items-center text-center">
        {period === "week" ? (
          <>
            <div className="flex items-end gap-3" aria-hidden>
              {LEAGUES.map((l, i) => (
                <LeagueBadge key={l.name} league={l} size={i === 0 ? 64 : 44} dim={i !== 0} />
              ))}
            </div>
            <h1 className="mt-3 text-3xl font-black">{CURRENT_LEAGUE.name} League</h1>
            <p className="mt-1 font-semibold text-ink-500">Top {PROMOTE} advance to the next league</p>
          </>
        ) : (
          <>
            <span className="text-6xl" aria-hidden>🏆</span>
            <h1 className="mt-2 text-3xl font-black">All-time leaderboard</h1>
          </>
        )}
        <p className="text-sm font-bold text-ink-500">{board.data?.window_label ?? " "}</p>
      </header>

      <div role="tablist" aria-label="Leaderboard period" className="mx-auto mt-6 flex w-fit rounded-2xl bg-ink-100 p-1">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={period === p.id}
            onClick={() => setPeriod(p.id)}
            className={clsx(
              "rounded-xl px-5 py-2 text-sm font-extrabold uppercase tracking-wide transition",
              period === p.id ? "bg-surface text-ocean-800 shadow-sm" : "text-ink-500 hover:text-ink-700",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {board.isPending && (
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        )}
        {board.isError && <ErrorState error={board.error} onRetry={() => board.refetch()} retrying={board.isRefetching} />}
        {board.data && board.data.entries.length === 0 && (
          <p className="py-10 text-center font-bold text-ink-500">No one has earned XP in this period yet. Be the first!</p>
        )}
        {board.data && (
          <ol className="space-y-1">
            {board.data.entries.map((e, i, all) => {
              const zones = period === "week" && all.length > PROMOTE + DEMOTE;
              const zone = !zones ? undefined : e.rank <= PROMOTE ? "promote" : i >= all.length - DEMOTE ? "demote" : undefined;
              return (
                <Fragment key={e.user_id}>
                  {zones && i === all.length - DEMOTE && <ZoneDivider kind="demote" />}
                  <Row entry={e} zone={zone} />
                  {zones && e.rank === PROMOTE && <ZoneDivider kind="promote" />}
                </Fragment>
              );
            })}
          </ol>
        )}
        {board.data?.me && (
          <ul className="mt-4 border-t-2 border-dashed border-ink-200 pt-4" aria-label="Your position">
            <Row entry={board.data.me} />
          </ul>
        )}
      </div>
    </PageShell>
  );
}

function ZoneDivider({ kind }: { kind: "promote" | "demote" }) {
  const up = kind === "promote";
  return (
    <li className={clsx("flex list-none items-center gap-3 py-2 text-sm font-black uppercase tracking-wider", up ? "text-leaf-800" : "text-coral-800")}>
      <span className={clsx("h-0.5 flex-1 rounded-full", up ? "bg-leaf-400" : "bg-coral-400")} />
      {up ? "▲ Promotion zone" : "▼ Demotion zone"}
      <span className={clsx("h-0.5 flex-1 rounded-full", up ? "bg-leaf-400" : "bg-coral-400")} />
    </li>
  );
}

function Row({ entry, zone }: { entry: LeaderboardEntry; zone?: "promote" | "demote" }) {
  return (
    <li
      aria-current={entry.is_me ? "true" : undefined}
      className={clsx(
        "flex list-none items-center gap-4 rounded-2xl px-4 py-3 transition",
        entry.is_me ? "border-2 border-ocean-400 bg-ocean-50" : "hover:bg-ink-50",
      )}
    >
      <span className={clsx("w-8 text-center text-lg font-black", zone === "promote" ? "text-leaf-800" : zone === "demote" ? "text-coral-800" : "text-ink-500")}>
        {entry.rank === 0 ? "–" : MEDALS[entry.rank - 1] ?? entry.rank}
      </span>
      <Avatar name={entry.display_name} color={entry.avatar_color} />
      <span className="min-w-0 flex-1 truncate font-extrabold">
        {entry.display_name}
        {entry.is_me && <span className="ml-2 text-xs font-black uppercase text-ocean-800">You</span>}
      </span>
      <span className="font-black tabular-nums text-ink-500">{entry.xp} XP</span>
    </li>
  );
}
