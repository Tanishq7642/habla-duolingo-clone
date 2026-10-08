"use client";

import { DailyGoalCard } from "@/components/gamification/DailyGoalCard";
import { PageShell } from "@/components/layout/PageShell";
import { HeartIcon } from "@/components/lesson/LessonHeader";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { useLearner, useRefillHearts } from "@/lib/queries";

/** Gems are a mocked currency (no real purchases); refilling hearts is a real, persisted transaction. */
export default function ShopPage() {
  const me = useLearner();
  const refill = useRefillHearts();
  const toast = useToast();

  if (me.isError) return <PageShell><ErrorState error={me.error} onRetry={() => me.refetch()} /></PageShell>;
  if (!me.data) return <PageShell><Skeleton className="h-96" /></PageShell>;

  const { hearts, max_hearts, gems, heart_refill_cost } = me.data;
  const full = hearts >= max_hearts;
  const affordable = gems >= heart_refill_cost;

  const buy = () =>
    refill.mutate(undefined, {
      onSuccess: () => toast("Hearts refilled!", { tone: "success", icon: "❤️" }),
      onError: (e) => toast(e instanceof ApiError ? e.message : "Couldn't refill hearts.", { tone: "error" }),
    });

  return (
    <PageShell rail={<DailyGoalCard />}>
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-black">Shop</h1>
        <span className="text-lg font-black text-gem-800">💎 {gems}</span>
      </div>

      <h2 className="mt-8 text-xl font-black">Hearts</h2>
      <div className="mt-3 flex items-center gap-4 rounded-2xl border-2 border-ink-200 p-4">
        <span className="text-3xl" aria-hidden>❤️</span>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold">Refill hearts</p>
          <p className="text-sm text-ink-500">{full ? "Your hearts are full." : `You have ${hearts} of ${max_hearts}.`}</p>
          <div className="mt-1 flex gap-0.5" aria-hidden>
            {Array.from({ length: max_hearts }, (_, i) => (
              <HeartIcon key={i} className={i < hearts ? "h-5 w-5 text-coral-500" : "h-5 w-5 text-ink-200"} />
            ))}
          </div>
        </div>
        <Button variant="ghost" size="sm" disabled={full || !affordable} loading={refill.isPending} onClick={buy} className="!text-gem-800">
          💎 {heart_refill_cost}
        </Button>
      </div>
      {!full && (
        <div className="mt-3 flex items-center gap-4 rounded-2xl border-2 border-ink-200 p-4">
          <span className="text-3xl" aria-hidden>💪</span>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold">Practice to earn a heart</p>
            <p className="text-sm text-ink-500">Free. Practice never costs hearts.</p>
          </div>
          <ButtonLink href="/practice" variant="ghost" size="sm" className="!text-ocean-800">Practice</ButtonLink>
        </div>
      )}

      <h2 className="mt-8 text-xl font-black">Power-ups & Super</h2>
      <div className="mt-3 space-y-3">
        <ComingSoon icon="🧊" title="Streak Freeze" body="Keep your streak safe for one missed day." />
        <ComingSoon icon="♾️" title="Super Habla – unlimited hearts" body="Subscriptions and in-app purchases aren't part of this demo." />
      </div>
    </PageShell>
  );
}
