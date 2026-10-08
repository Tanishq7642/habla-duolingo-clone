"use client";

import clsx from "clsx";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";

import { rem } from "@/lib/units";

export type MascotMood = "happy" | "cheer" | "sad" | "think";

interface Props {
  mood?: MascotMood;
  size?: number;
  className?: string;
  /** Eyes follow the pointer and a click makes Pip hop. */
  interactive?: boolean;
  /** Kept for API compatibility: Pip is always gently animated now. */
  float?: boolean;
}

// Palette (flat, no outlines – Duolingo's illustration style).
const GREEN = "#58CC02";
const GREEN_DARK = "#4AAD02";
const GREEN_LIGHT = "#89E219";
const BELLY = "#A5ED6E";
const LEAF_DARK = "#3E9A00";
const EYE_DARK = "#3C3C3C";
const FEET = "#C47A2C";

const BODY = "M60 30 C90 30 104 54 104 80 C104 104 86 118 60 118 C34 118 16 104 16 80 C16 54 30 30 60 30Z";

/**
 * "Pip" – Habla's own mascot: a sprout creature drawn in Duolingo's flat style and
 * animated with CSS (breathing, blinking, swaying leaves, waving, hopping; see the
 * `.pip-*` rules in globals.css). Original artwork; no Duolingo assets.
 */
export function Mascot({ mood = "happy", size = 96, className, interactive }: Props) {
  const uid = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const [hopKey, setHopKey] = useState(0);

  // Deterministic per-instance timing so several Pips on a page don't blink in sync
  // (derived from useId, so server and client render the same values).
  const seed = [...uid].reduce((n, ch) => n + ch.charCodeAt(0), 0);
  const blinkDelay = `${(seed % 37) / 10}s`;
  const waveDelay = `${(seed % 23) / 10 + 2}s`;

  // Eyes follow the pointer (written straight to CSS variables: no re-renders).
  useEffect(() => {
    if (!interactive) return;
    const svg = svgRef.current;
    if (!svg) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = svg.getBoundingClientRect();
        const dx = e.clientX - (box.left + box.width / 2);
        const dy = e.clientY - (box.top + box.height * 0.45);
        const dist = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, dist / 260);
        svg.style.setProperty("--look-x", `${(dx / dist) * 3.6 * reach}px`);
        svg.style.setProperty("--look-y", `${(dy / dist) * 3.2 * reach}px`);
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [interactive]);

  const hop = (e: MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    setHopKey((k) => k + 1); // re-mounting the group restarts the hop animation
  };

  const label =
    mood === "cheer" ? "Pip is cheering" : mood === "sad" ? "Pip looks sad" : mood === "think" ? "Pip is thinking" : "Pip, the Habla mascot";

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 120 130"
      style={{ width: rem(size), height: rem(size * (130 / 120)) }}
      role="img"
      aria-label={label}
      onClick={hop}
      className={clsx("pip overflow-visible", `pip-${mood}`, interactive && "cursor-pointer", className)}
    >
      <defs>
        <clipPath id={`body-${uid}`}>
          <path d={BODY} />
        </clipPath>
      </defs>

      {/* ground shadow – shrinks when Pip lifts off */}
      <ellipse key={`s${hopKey}`} className={clsx("pip-shadow", hopKey > 0 && "pip-shadow-hop")} cx="60" cy="123" rx="31" ry="6" fill="#000" opacity=".16" />

      <g key={`b${hopKey}`} className={clsx("pip-root", hopKey > 0 && "pip-hop")}>
        {/* feet (little roots) */}
        <ellipse cx="46" cy="118" rx="9" ry="5" fill={FEET} />
        <ellipse cx="74" cy="118" rx="9" ry="5" fill={FEET} />

        <g className="pip-body">
          {/* leaf-hands, behind the body */}
          <g className="pip-arm-l">
            <path d="M22 78 C6 74 2 88 8 96 C16 94 22 86 22 78Z" fill={GREEN_DARK} />
          </g>
          <g className="pip-arm-r" style={{ animationDelay: waveDelay }}>
            <path d="M98 78 C114 74 118 88 112 96 C104 94 98 86 98 78Z" fill={GREEN_DARK} />
          </g>

          {/* body with darker side shading and a lighter belly */}
          <path d={BODY} fill={GREEN} />
          <g clipPath={`url(#body-${uid})`}>
            <ellipse cx="112" cy="84" rx="26" ry="46" fill={GREEN_DARK} />
            <ellipse cx="40" cy="44" rx="20" ry="11" fill={GREEN_LIGHT} opacity=".7" transform="rotate(-24 40 44)" />
          </g>
          <ellipse cx="60" cy="101" rx="26" ry="15" fill={BELLY} />
          <path d="M50 99 q4 3 8 0 M62 99 q4 3 8 0 M56 106 q4 3 8 0" stroke={GREEN_LIGHT} strokeWidth="2.6" strokeLinecap="round" fill="none" />

          {/* sprout on the head */}
          <g className="pip-leaves">
            <path d="M60 33 C60 26 61 21 62 15" stroke={LEAF_DARK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M62 18 C49 5 33 9 31 18 C41 25 53 24 62 18Z" fill={GREEN_LIGHT} />
            <path d="M62 18 C74 3 92 7 94 16 C84 25 71 24 62 18Z" fill={GREEN} />
            <path d="M62 18 C55 14 46 13 38 16" stroke={GREEN} strokeWidth="2" strokeLinecap="round" fill="none" opacity=".8" />
          </g>

          <Face mood={mood} blinkDelay={blinkDelay} uid={uid} />
        </g>
      </g>
    </svg>
  );
}

function Face({ mood, blinkDelay, uid }: { mood: MascotMood; blinkDelay: string; uid: string }) {
  const cheer = mood === "cheer";
  const sad = mood === "sad";
  const think = mood === "think";
  return (
    <g>
      {/* cheeks */}
      <ellipse cx="32" cy="79" rx="7" ry="4.5" fill="#FF9AAE" opacity=".85" />
      <ellipse cx="88" cy="79" rx="7" ry="4.5" fill="#FF9AAE" opacity=".85" />

      {cheer ? (
        // happy closed "^ ^" eyes
        <g stroke={EYE_DARK} strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M37 64 q8 -10 16 0" />
          <path d="M67 64 q8 -10 16 0" />
        </g>
      ) : (
        <>
          <clipPath id={`eyes-${uid}`}>
            <ellipse cx="45" cy="63" rx="13" ry="15" />
            <ellipse cx="75" cy="63" rx="13" ry="15" />
          </clipPath>
          <ellipse cx="45" cy="63" rx="13" ry="15" fill="#fff" />
          <ellipse cx="75" cy="63" rx="13" ry="15" fill="#fff" />
          <g clipPath={`url(#eyes-${uid})`}>
            {/* pupils follow --look-x/--look-y (pointer); they lean up when thinking */}
            <g className="pip-pupils" style={think ? { transform: "translate(2px,-4px)" } : undefined}>
              <circle cx="47" cy="65" r="7.5" fill={EYE_DARK} />
              <circle cx="73" cy="65" r="7.5" fill={EYE_DARK} />
              <circle cx="49.5" cy="62" r="2.6" fill="#fff" />
              <circle cx="75.5" cy="62" r="2.6" fill="#fff" />
            </g>
            {/* eyelids for blinking (body-coloured, drop from the top) */}
            <g className="pip-lids" style={{ animationDelay: blinkDelay }}>
              <rect x="30" y="46" width="30" height="34" fill={GREEN} />
              <rect x="60" y="46" width="30" height="34" fill={GREEN} />
            </g>
          </g>
          {sad && (
            <g stroke={LEAF_DARK} strokeWidth="3.5" strokeLinecap="round">
              {/* worried brows: inner ends raised */}
              <path d="M34 51 L51 46" />
              <path d="M86 51 L69 46" />
            </g>
          )}
        </>
      )}

      {/* mouth */}
      {cheer && <path d="M47 82 q13 16 26 0 z" fill="#B8262F" />}
      {cheer && <path d="M53 88 q7 5 14 0" fill="#FF8FA0" />}
      {sad && <path d="M50 88 q10 -7 20 0" stroke={EYE_DARK} strokeWidth="4" strokeLinecap="round" fill="none" />}
      {think && <path d="M54 86 h11" stroke={EYE_DARK} strokeWidth="4" strokeLinecap="round" />}
      {mood === "happy" && <path d="M50 83 q10 9 20 0" stroke={EYE_DARK} strokeWidth="4" strokeLinecap="round" fill="none" />}
      {sad && <path className="pip-tear" d="M89 66 q4 8 0 12 q-4 -4 0 -12z" fill="#49C0F8" />}
    </g>
  );
}
