"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Right-hand column that behaves like Duolingo's: it scrolls with the page until
 * its last card is fully in view, then stays put (instead of scrolling away).
 *
 * How: `position: sticky` with a *negative* top equal to how much taller the
 * column is than the viewport. Columns shorter than the screen simply stick at 0.
 */
export function StickyRail({ children, label, className }: { children: ReactNode; label: string; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [top, setTop] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setTop(Math.min(0, window.innerHeight - el.offsetHeight));
    update();
    const observer = new ResizeObserver(update); // cards load in / change height
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <aside ref={ref} aria-label={label} className={className} style={{ position: "sticky", top, alignSelf: "flex-start" }}>
      {children}
    </aside>
  );
}
