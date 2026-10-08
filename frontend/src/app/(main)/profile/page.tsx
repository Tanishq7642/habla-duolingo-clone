"use client";

import { AchievementGrid } from "@/components/profile/AchievementGrid";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsGrid } from "@/components/profile/StatsGrid";
import { ActivityCard } from "@/components/gamification/ActivityCard";
import { PageShell } from "@/components/layout/PageShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useStats } from "@/lib/queries";

export default function ProfilePage() {
  const stats = useStats();

  return (
    <PageShell narrow rail={<ActivityCard />}>
      {stats.isPending && (
        <div className="space-y-6">
          <Skeleton className="h-40" />
          <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
        </div>
      )}
      {stats.isError && <ErrorState error={stats.error} onRetry={() => stats.refetch()} retrying={stats.isRefetching} />}
      {stats.data && (
        <div className="space-y-10">
          <ProfileHeader learner={stats.data.learner} />
          <StatsGrid stats={stats.data} />
          <AchievementGrid achievements={stats.data.achievements} />
        </div>
      )}
    </PageShell>
  );
}
