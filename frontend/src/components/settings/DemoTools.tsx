"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { useDemoTools } from "@/lib/queries";

/**
 * Lets a reviewer exercise the day-based rules (streak, daily goal) without
 * waiting for midnight. Backed by /api/dev/* – see backend/app/services/dev_service.py.
 */
export function DemoTools() {
  const { timeTravel, reset } = useDemoTools();
  const toast = useToast();
  const fail = (e: unknown) => toast(e instanceof ApiError ? e.message : "Demo tool failed.", { tone: "error" });

  return (
    <section className="mt-10 rounded-3xl border-2 border-dashed border-grape-400 bg-grape-50/50 p-5" aria-labelledby="demo-tools">
      <h2 id="demo-tools" className="text-lg font-black">🧪 Demo tools</h2>
      <p className="mt-1 text-sm text-ink-500">
        Simulate time passing to see streaks and daily goals react. This shifts your history back a day, exactly as if a day went by.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Button
          size="sm"
          variant="secondary"
          loading={timeTravel.isPending && timeTravel.variables === 1}
          onClick={() =>
            timeTravel.mutate(1, {
              onSuccess: (me) => toast(`It's tomorrow – streak: ${me.streak.current}${me.streak.at_risk ? " (at risk!)" : ""}`, { icon: "⏩" }),
              onError: fail,
            })
          }
        >
          Next day
        </Button>
        <Button
          size="sm"
          variant="danger"
          loading={timeTravel.isPending && timeTravel.variables === 2}
          onClick={() =>
            timeTravel.mutate(2, { onSuccess: () => toast("Skipped a day – streak lost", { icon: "💔", tone: "error" }), onError: fail })
          }
        >
          Skip a day
        </Button>
        <Button
          size="sm"
          variant="ghost"
          loading={reset.isPending}
          onClick={() => reset.mutate(undefined, { onSuccess: () => toast("Demo data restored", { icon: "♻️", tone: "success" }), onError: fail })}
        >
          Reset demo
        </Button>
      </div>
    </section>
  );
}
