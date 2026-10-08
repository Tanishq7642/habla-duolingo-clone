import clsx from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx(
        "animate-shimmer rounded-2xl bg-[length:800px_100%]",
        "bg-[linear-gradient(90deg,#EEF2F6_0%,#F7F9FB_40%,#EEF2F6_80%)]",
        className,
      )}
    />
  );
}
