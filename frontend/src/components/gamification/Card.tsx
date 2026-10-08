import clsx from "clsx";
import type { ReactNode } from "react";

/** Side-rail card. Sized to Duolingo's right column (≈20px titles, 15–16px body). */
export function Card({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-3xl border-2 border-ink-100 p-6", className)} aria-label={title}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-[1.4rem] font-black leading-tight text-ink-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
