"use client";

import { useEffect, useRef, useState } from "react";

/** Counts from the currently displayed value to the new one (e.g. XP after a lesson). */
export function AnimatedNumber({ value, duration = 900, from }: { value: number; duration?: number; from?: number }) {
  const [shown, setShown] = useState(from ?? value);
  // Track what is on screen, not the last target: an interrupted animation
  // (or StrictMode's effect re-run) resumes from where it actually is.
  const shownRef = useRef(shown);

  useEffect(() => {
    const start = shownRef.current;
    if (start === value) return;
    const update = (n: number) => {
      shownRef.current = n;
      setShown(n);
    };
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      update(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      update(Math.round(start + (value - start) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className="tabular-nums">{shown}</span>;
}
