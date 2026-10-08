"use client";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useReview } from "@/lib/queries";

/** Post-lesson review of missed exercises (fetched only after completion, so answers can't leak early). */
export function MistakeReview({ attemptId, onClose }: { attemptId: number | null; onClose: () => void }) {
  const review = useReview(attemptId);
  return (
    <Modal open={attemptId !== null} onClose={onClose} title="Review your mistakes" className="max-w-lg">
      <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
        {review.isPending && [0, 1].map((i) => <Skeleton key={i} className="h-28" />)}
        {review.isError && <ErrorState compact error={review.error} onRetry={() => review.refetch()} />}
        {review.data?.items.map((item) => (
          <article key={item.exercise_id} className="rounded-2xl border-2 border-ink-100 p-4">
            <p className="text-sm font-extrabold text-ink-500">{item.prompt}</p>
            <dl className="mt-2 space-y-1">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-xs font-black uppercase tracking-wide text-coral-800">You said</dt>
                <dd className="font-bold text-ink-700 line-through decoration-coral-400">{item.your_answer}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-xs font-black uppercase tracking-wide text-leaf-800">Correct</dt>
                <dd className="font-extrabold text-ink-900">{item.correct_answer}</dd>
              </div>
            </dl>
            {item.explanation && <p className="mt-2 rounded-xl bg-ocean-50 p-3 text-sm text-ocean-800">💡 {item.explanation}</p>}
          </article>
        ))}
        {review.data && review.data.items.length === 0 && <p className="text-ink-500">No mistakes to review. 🎉</p>}
      </div>
      <Button block className="mt-5" onClick={onClose}>
        Got it
      </Button>
    </Modal>
  );
}
