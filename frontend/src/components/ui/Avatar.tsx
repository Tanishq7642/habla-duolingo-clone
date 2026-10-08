import clsx from "clsx";

export function Avatar({ name, color, size = 44, className }: { name: string; color: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={clsx("inline-flex shrink-0 items-center justify-center rounded-full border-b-4 font-black text-white", className)}
      style={{ width: size, height: size, background: color, borderColor: "rgba(0,0,0,.18)", fontSize: size * 0.42 }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
