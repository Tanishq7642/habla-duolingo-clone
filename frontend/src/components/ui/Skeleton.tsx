import clsx from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx(
        "animate-shimmer rounded-2xl bg-[length:800px_100%]",
        "bg-[linear-gradient(90deg,rgb(var(--ink-100))_0%,rgb(var(--ink-50))_40%,rgb(var(--ink-100))_80%)]",
        className,
      )}
    />
  );
}
