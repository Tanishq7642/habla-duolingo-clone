import clsx from "clsx";
import type { ReactNode } from "react";

export function Card({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-3xl border-2 border-ink-100 p-5", className)} aria-label={title}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between">
          {title && <h2 className="text-lg font-black text-ink-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
