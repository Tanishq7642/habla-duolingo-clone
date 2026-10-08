import { ApiError } from "@/lib/api";

import { Button, ButtonLink } from "./Button";
import { Mascot } from "./Mascot";

interface Props {
  error: unknown;
  onRetry?: () => void;
  retrying?: boolean;
  compact?: boolean;
}

/** Turns an API error into a specific, actionable message. */
export function describeError(error: unknown): { title: string; body: string } {
  if (error instanceof ApiError) {
    if (error.isNetwork || error.code === "server_unavailable") {
      return {
        title: "Can't reach Habla",
        body: "The learning server isn't responding. Make sure the API is running, then try again.",
      };
    }
    if (error.code === "lesson_locked") return { title: "Lesson locked 🔒", body: error.message };
    if (error.code === "out_of_hearts") return { title: "Out of hearts", body: error.message };
    if (error.status === 404) return { title: "Not found", body: error.message };
    return { title: "That didn't work", body: error.message };
  }
  return { title: "Unexpected error", body: "Please try again. If it keeps happening, reload the page." };
}

/** Retrying only helps for transient failures (offline, 5xx); a 403/404 won't change. */
export function isRetryable(error: unknown): boolean {
  return !(error instanceof ApiError) || error.isNetwork || error.status >= 500;
}

export function ErrorState({ error, onRetry: retry, retrying, compact }: Props) {
  const { title, body } = describeError(error);
  const onRetry = isRetryable(error) ? retry : undefined;
  if (compact) {
    return (
      <div role="alert" className="rounded-2xl border-2 border-coral-100 bg-coral-50 p-4 text-sm">
        <p className="font-extrabold text-coral-700">{title}</p>
        <p className="mt-1 text-ink-700">{body}</p>
        {onRetry && (
          <Button size="sm" variant="ghost" className="mt-3" onClick={onRetry} loading={retrying}>
            Try again
          </Button>
        )}
      </div>
    );
  }
  return (
    <div role="alert" className="mx-auto flex max-w-sm flex-col items-center gap-4 px-6 py-16 text-center">
      <Mascot mood="sad" size={120} />
      <h2 className="text-2xl font-black text-ink-900">{title}</h2>
      <p className="text-ink-500">{body}</p>
      <div className="flex gap-3">
        {onRetry && (
          <Button onClick={onRetry} loading={retrying}>
            Try again
          </Button>
        )}
        {error instanceof ApiError && error.code === "out_of_hearts" && (
          <ButtonLink href="/practice" variant="secondary">
            Practice +1 ❤️
          </ButtonLink>
        )}
        <ButtonLink href="/" variant="ghost">
          Go home
        </ButtonLink>
      </div>
    </div>
  );
}
