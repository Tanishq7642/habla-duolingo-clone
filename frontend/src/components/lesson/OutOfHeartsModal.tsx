"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api";
import { useLearner, useRefillHearts } from "@/lib/queries";

import { HeartIcon } from "./LessonHeader";

interface Props {
  open: boolean;
  onRefilled: (hearts: number) => void;
  onPractice: () => void;
  onQuit: () => void;
}

export function OutOfHeartsModal({ open, onRefilled, onPractice, onQuit }: Props) {
  const learner = useLearner();
  const refill = useRefillHearts();
  const cost = learner.data?.heart_refill_cost ?? 350;
  const gems = learner.data?.gems ?? 0;
  const canAfford = gems >= cost;

  return (
    <Modal open={open} title="You ran out of hearts" className="text-center">
      <div className="mt-4 flex justify-center gap-1" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <HeartIcon key={i} className="h-9 w-9 text-ink-200" />
        ))}
      </div>
      <p className="mt-4 text-ink-500">
        Take a breather. Your lesson progress is saved – earn a heart with a quick practice, or refill now.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Button variant="secondary" block onClick={onPractice}>
          💪 Practice to earn a heart
        </Button>
        <Button
          variant="sun"
          block
          disabled={!canAfford}
          loading={refill.isPending}
          onClick={() => refill.mutate(undefined, { onSuccess: (r) => onRefilled(r.hearts) })}
        >
          Refill hearts · 💎 {cost}
        </Button>
        {!canAfford && <p className="text-sm font-bold text-ink-500">You have 💎 {gems}. Complete lessons to earn gems.</p>}
        {refill.error && (
          <p role="alert" className="text-sm font-bold text-coral-800">
            {refill.error instanceof ApiError ? refill.error.message : "Couldn't refill hearts."}
          </p>
        )}
        <Button variant="plain" block onClick={onQuit}>
          End lesson
        </Button>
      </div>
    </Modal>
  );
}
