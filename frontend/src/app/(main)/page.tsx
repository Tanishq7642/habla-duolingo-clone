import { ActivityCard } from "@/components/gamification/ActivityCard";
import { DailyGoalCard } from "@/components/gamification/DailyGoalCard";
import { PracticeCard } from "@/components/gamification/PracticeCard";
import { PageShell } from "@/components/layout/PageShell";
import { LearningPath } from "@/components/path/LearningPath";

export default function LearnPage() {
  return (
    <PageShell
      rail={
        <>
          <DailyGoalCard />
          <PracticeCard />
          <ActivityCard />
        </>
      }
    >
      <div className="mb-8 xl:hidden">
        <DailyGoalCard />
      </div>
      <LearningPath />
      <div className="mt-4 space-y-5 xl:hidden">
        <PracticeCard />
        <ActivityCard />
      </div>
    </PageShell>
  );
}
