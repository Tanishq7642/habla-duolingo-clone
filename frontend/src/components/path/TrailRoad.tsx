"use client";

import { useLayoutEffect, useRef, useState } from "react";

import type { Candy } from "./theme";

interface Point {
  x: number;
  y: number;
  done: boolean;
}

/**
 * The candy-dotted road that winds between the levels of one unit (Candy Crush
 * style). Render it as the first child of the list of levels: it measures where
 * the level buttons actually are (`[data-trail-point]` in its parent) and draws a smooth S-curve through their centres:
 * coloured up to your current level, grey for the locked part.
 */
export function TrailRoad({ candy, version }: {
  candy: Candy;
  /** Changes whenever level statuses change, so the road re-measures. */
  version: string;
}) {
  const [points, setPoints] = useState<Point[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    // The parent element, not a ref passed down: a parent's ref isn't attached yet
    // when its children's layout effects run.
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      setSize({ w: box.width, h: box.height });
      setPoints(
        [...el.querySelectorAll<HTMLElement>("[data-trail-point]")].map((node) => {
          const r = node.getBoundingClientRect();
          return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top, done: node.dataset.trailDone !== undefined };
        }),
      );
    };
    measure();
    const observer = new ResizeObserver(measure); // fonts, rem changes, popovers
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [version]);

  // Up to (and including) the last unlocked level the road is "travelled".
  let lastDone = -1;
  points.forEach((p, i) => p.done && (lastDone = i));
  const all = points.length > 1 ? curve(points) : null;
  const travelled = all && lastDone > 0 ? curve(points.slice(0, lastDone + 1)) : null;

  return (
    <svg ref={svgRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-visible" width={size.w} height={size.h}>
      {/* road bed */}
      {all && <path d={all} fill="none" stroke="rgb(var(--ink-200))" strokeWidth={22} strokeLinecap="round" />}
      {travelled && <path d={travelled} fill="none" stroke={candy.light} strokeWidth={22} strokeLinecap="round" opacity={0.55} />}
      {/* candy dots along the middle */}
      {all && <path d={all} fill="none" stroke="rgb(var(--surface))" strokeWidth={7} strokeLinecap="round" strokeDasharray="0 17" />}
      {travelled && <path d={travelled} fill="none" stroke={candy.base} strokeWidth={7} strokeLinecap="round" strokeDasharray="0 17" />}
    </svg>
  );
}

/** Smooth path through the points: each hop is a cubic curve with vertical tangents (an "S" bend). */
function curve(points: Point[]): string {
  return points
    .map((p, i) => {
      if (i === 0) return `M${p.x},${p.y}`;
      const prev = points[i - 1];
      const dy = (p.y - prev.y) / 2;
      return `C${prev.x},${prev.y + dy} ${p.x},${p.y - dy} ${p.x},${p.y}`;
    })
    .join(" ");
}
