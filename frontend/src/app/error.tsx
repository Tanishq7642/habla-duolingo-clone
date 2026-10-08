"use client";

import { ErrorState } from "@/components/ui/ErrorState";

/** Last-resort boundary for render errors (API errors are handled in place). */
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[100dvh] items-center">
      <ErrorState error={error} onRetry={reset} />
    </div>
  );
}
