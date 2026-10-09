"use client";

import { useEffect, useState } from "react";

/**
 * Duolingo-style floating button that appears when your current lesson is
 * scrolled out of view; the arrow points towards it and a click brings it back.
 *
 * Rendered as the last child of the path column with `position: sticky; bottom`,
 * so it floats at the bottom of the screen *within the path column* (it never
 * covers the sidebars) and settles at the end of the path when you reach it.
 * The sticky wrapper has zero height (the button hangs above it), so showing or
 * hiding the button never shifts the page; z-40 keeps it above the pinned unit banners.
 */
export function JumpToCurrent({ targetId }: { targetId: string }) {
  const [direction, setDirection] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setDirection(null);
        // Compare with the shrunken viewport (rootBounds), not the screen edge.
        else setDirection(entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0) ? "up" : "down");
      },
      // The pinned unit banner (and the phone header / bottom nav) cover the edges of
      // the screen: a lesson hidden behind them doesn't count as "in view".
      { threshold: 0.6, rootMargin: "-200px 0px -100px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  const jump = () => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <div className="pointer-events-none sticky bottom-24 z-40 h-0 lg:bottom-8">
      {direction && (
        <button
          type="button"
          onClick={jump}
          aria-label={`Scroll ${direction} to your current lesson`}
          className="pointer-events-auto absolute bottom-0 right-0 flex h-14 w-14 animate-pop items-center justify-center rounded-2xl border-2 border-b-4 border-ink-200 bg-surface text-ocean-500 shadow-sm transition hover:bg-ink-50 active:translate-y-[2px] active:border-b-2"
        >
          <svg viewBox="0 0 24 24" className={direction === "up" ? "h-7 w-7" : "h-7 w-7 rotate-180"} aria-hidden>
            <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
