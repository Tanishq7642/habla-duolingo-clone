import clsx from "clsx";
import type { ReactNode } from "react";

/** Side-rail card styled like Duolingo's right column: plain surface, 2px #E5E5E5 border, ~16px radius. */
export function Card({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-[1.1rem] border-2 border-ink-200 p-6", className)} aria-label={title}>
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
