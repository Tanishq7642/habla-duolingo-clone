import clsx from "clsx";

/**
 * Crown badge = a skill's mastery level (backend field `mastery`, 0–5).
 * Level N means every lesson in the skill was completed N times.
 */
export function CrownBadge({ level, max, className }: { level: number; max: number; className?: string }) {
  const earned = level > 0;
  return (
    <span
      className={clsx("relative inline-flex h-8 w-8 items-center justify-center", className)}
      aria-label={`Crown level ${level} of ${max}`}
      role="img"
    >
      <svg viewBox="0 0 32 28" className="absolute inset-0 h-full w-full" aria-hidden>
        <path
          d="M3 9 L9 15 L16 4 L23 15 L29 9 L26 25 H6 Z"
          fill={earned ? "#FFC800" : "rgb(var(--ink-200))"}
          stroke={earned ? "#E5A800" : "rgb(var(--ink-300))"}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className={clsx("relative mt-2 text-[0.6875rem] font-black", earned ? "text-[#5C3F00]" : "text-ink-500")}>{level}</span>
    </span>
  );
}
