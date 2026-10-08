import clsx from "clsx";

interface BarProps {
  value: number; // 0..1
  className?: string;
  color?: "leaf" | "sun" | "ocean" | "flame";
  label: string;
}

const barColors = {
  leaf: "bg-leaf-500",
  sun: "bg-sun-500",
  ocean: "bg-ocean-500",
  flame: "bg-flame-500",
};

export function ProgressBar({ value, className, color = "leaf", label }: BarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={clsx("h-4 w-full overflow-hidden rounded-full bg-ink-100", className)}
    >
      <div
        className={clsx("relative h-full rounded-full transition-[width] duration-500 ease-out", barColors[color])}
        style={{ width: `${pct}%` }}
      >
        {/* glossy highlight */}
        <span className="absolute inset-x-2 top-[3px] h-[4px] rounded-full bg-white/35" />
      </div>
    </div>
  );
}

interface RingProps {
  value: number; // 0..1
  size: number;
  stroke?: number;
  color: string;
  track?: string;
  children?: React.ReactNode;
  className?: string;
}

/** SVG progress ring drawn around skill nodes. */
export function ProgressRing({ value, size, stroke = 8, color, track = "rgb(var(--ink-200))", children, className }: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, value)));
  return (
    <div className={clsx("relative", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
