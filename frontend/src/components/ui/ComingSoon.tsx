import clsx from "clsx";

/** Placeholder for features that are intentionally out of scope (per the assignment brief). */
export function ComingSoon({ icon, title, body, className }: { icon: string; title: string; body: string; className?: string }) {
  return (
    <div className={clsx("flex items-center gap-4 rounded-2xl border-2 border-dashed border-ink-200 p-4", className)}>
      <span className="text-3xl grayscale-[30%]" aria-hidden>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold text-ink-700">{title}</p>
        <p className="text-sm text-ink-500">{body}</p>
      </div>
      <span className="shrink-0 rounded-lg bg-ink-100 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-ink-400">
        Coming soon
      </span>
    </div>
  );
}
