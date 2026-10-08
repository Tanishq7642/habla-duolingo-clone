"use client";

import { ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePracticeSummary } from "@/lib/queries";

import { Card } from "./Card";
import { PracticeIcon } from "./PracticeIcon";

/** Smart practice: surfaces exercises the learner keeps missing. */
export function PracticeCard() {
  const { data, isPending, isError } = usePracticeSummary();
  if (isPending) return <Skeleton className="h-36" />;
  if (isError || !data) return null;

  const weak = data.weak_exercises;
  return (
    <Card title="Smart practice">
      <div className="flex items-center gap-4">
        <PracticeIcon className="h-16 w-16 shrink-0" />
        <p className="text-base font-semibold text-ink-700">
          {!data.available
            ? data.reason
            : weak > 0
              ? `You've struggled with ${weak} exercise${weak === 1 ? "" : "s"}. A quick review locks them in – and earns a heart.`
              : "No weak spots right now! Practise past lessons to stay sharp and earn a heart."}
        </p>
      </div>
      {data.available && (
        <ButtonLink href="/practice" variant="ghost" block className="mt-5 !text-ocean-500">
          {weak > 0 ? "Practise weak areas" : "Practise"}
        </ButtonLink>
      )}
    </Card>
  );
}
