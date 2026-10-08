"use client";

import clsx from "clsx";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";

import { rem } from "@/lib/units";

export type MascotMood = "happy" | "cheer" | "sad" | "think";

interface Props {
  mood?: MascotMood;
  size?: number;
  className?: string;
  /** Head/eyes follow the pointer and a click makes Pip hop. */
  interactive?: boolean;
  /** Kept for API compatibility: Pip is always gently animated now. */
  float?: boolean;
}

const EYE_DARK = "#2F3437";
const BODY = "M60 30 C90 30 104 54 104 80 C104 104 86 118 60 118 C34 118 16 104 16 80 C16 54 30 30 60 30Z";

/**
 * "Pip" – Habla's own mascot, drawn in Duolingo's rounded style with gradient
 * shading so it reads as 3D. Alive at all times via CSS (breathing, blinking,
 * leaf sway, waving; `.pip-*` in globals.css). Interactive Pips turn their head
 * towards the pointer: the face layer shifts most, the leaves lag and the body
 * leans slightly (parallax = a 3D head turn), and a click makes them hop.
 * Original artwork; no Duolingo assets.
 */
export function Mascot({ mood = "happy", size = 96, className, interactive }: Props) {
  const uid = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const [hopKey, setHopKey] = useState(0);
  const id = (name: string) => `${name}-${uid}`;

  // Deterministic per-instance timing so several Pips don't blink in sync
  // (derived from useId, so server and client render the same values).
  const seed = [...uid].reduce((n, ch) => n + ch.charCodeAt(0), 0);
  const blinkDelay = `${(seed % 37) / 10}s`;
  const waveDelay = `${(seed % 23) / 10 + 2}s`;
  const lookDelay = `${(seed % 41) / 10}s`;

  // Pointer → CSS variables --lx/--ly in [-1, 1] (no React re-renders).
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
        const reach = Math.min(1, dist / 280);
        svg.style.setProperty("--lx", ((dx / dist) * reach).toFixed(3));
        svg.style.setProperty("--ly", ((dy / dist) * reach).toFixed(3));
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
      className={clsx("pip overflow-visible", `pip-${mood}`, interactive ? "pip-interactive cursor-pointer" : "pip-idle", className)}
    >
      <defs>
        {/* body: lit from the top-left, darker towards the bottom-right edge */}
        <radialGradient id={id("body")} cx="0.36" cy="0.3" r="0.78">
          <stop offset="0" stopColor="#8BE628" />
          <stop offset="0.45" stopColor="#58CC02" />
          <stop offset="1" stopColor="#3F9E00" />
        </radialGradient>
        <radialGradient id={id("belly")} cx="0.45" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#D4FFAE" />
          <stop offset="1" stopColor="#9BE45E" />
        </radialGradient>
        <linearGradient id={id("leafA")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A5F04A" />
          <stop offset="1" stopColor="#5DBF0C" />
        </linearGradient>
        <linearGradient id={id("leafB")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6FD81C" />
          <stop offset="1" stopColor="#3F9E00" />
        </linearGradient>
        <linearGradient id={id("arm")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5AC804" />
          <stop offset="1" stopColor="#3B9200" />
        </linearGradient>
        <radialGradient id={id("eye")} cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.75" stopColor="#F4F7F4" />
          <stop offset="1" stopColor="#D9E3D6" />
        </radialGradient>
        <radialGradient id={id("pupil")} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#5A6166" />
          <stop offset="1" stopColor={EYE_DARK} />
        </radialGradient>
        <linearGradient id={id("feet")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E0954A" />
          <stop offset="1" stopColor="#A9611F" />
        </linearGradient>
        <radialGradient id={id("shadow")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity=".28" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("shine")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id("clip-body")}>
          <path d={BODY} />
        </clipPath>
        <clipPath id={id("clip-eyes")}>
          <ellipse cx="45" cy="63" rx="13" ry="15" />
          <ellipse cx="75" cy="63" rx="13" ry="15" />
        </clipPath>
      </defs>

      {/* soft ground shadow – shrinks when Pip lifts off */}
      <ellipse key={`s${hopKey}`} className={clsx("pip-shadow", hopKey > 0 && "pip-shadow-hop")} cx="60" cy="123" rx="36" ry="8" fill={`url(#${id("shadow")})`} />

      <g key={`b${hopKey}`} className={clsx("pip-root", hopKey > 0 && "pip-hop")}>
        <ellipse cx="46" cy="118" rx="9.5" ry="5.5" fill={`url(#${id("feet")})`} />
        <ellipse cx="74" cy="118" rx="9.5" ry="5.5" fill={`url(#${id("feet")})`} />

        <g className="pip-body">
          {/* leaf-hands behind the body */}
          <g className="pip-arm-l">
            <path d="M22 78 C5 73 1 88 7 97 C16 95 22 87 22 78Z" fill={`url(#${id("arm")})`} />
          </g>
          <g className="pip-arm-r" style={{ animationDelay: waveDelay }}>
            <path d="M98 78 C115 73 119 88 113 97 C104 95 98 87 98 78Z" fill={`url(#${id("arm")})`} />
          </g>

          {/* shaded body, rim shadow, specular highlight */}
          <path d={BODY} fill={`url(#${id("body")})`} />
          <g clipPath={`url(#${id("clip-body")})`}>
            <ellipse cx="60" cy="128" rx="52" ry="18" fill="#2F7A00" opacity=".22" />
            <ellipse className="pip-shine" cx="40" cy="45" rx="17" ry="10" fill={`url(#${id("shine")})`} transform="rotate(-25 40 45)" />
          </g>

          {/* face layer: shifts towards the pointer (head turn) */}
          <g className="pip-face" style={{ animationDelay: lookDelay }}>
            <ellipse cx="60" cy="101" rx="26" ry="15" fill={`url(#${id("belly")})`} />
            <path d="M50 99 q4 3 8 0 M62 99 q4 3 8 0 M56 106 q4 3 8 0" stroke="#7FCF3A" strokeWidth="2.6" strokeLinecap="round" fill="none" />
            <Face mood={mood} blinkDelay={blinkDelay} id={id} />
          </g>

          {/* sprout: lags behind the face for depth */}
          <g className="pip-leaves-depth">
            <g className="pip-leaves">
              <path d="M60 33 C60 26 61 21 62 15" stroke="#3E9A00" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              <path d="M62 18 C49 5 33 9 31 18 C41 25 53 24 62 18Z" fill={`url(#${id("leafA")})`} />
              <path d="M62 18 C74 3 92 7 94 16 C84 25 71 24 62 18Z" fill={`url(#${id("leafB")})`} />
              <path d="M62 18 C55 14 46 13 38 16" stroke="#C8FF8A" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".7" />
              <path d="M62 18 C70 12 80 10 88 13" stroke="#A5F04A" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".6" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

function Face({ mood, blinkDelay, id }: { mood: MascotMood; blinkDelay: string; id: (n: string) => string }) {
  const cheer = mood === "cheer";
  const sad = mood === "sad";
  const think = mood === "think";
  return (
    <g>
      <ellipse cx="32" cy="79" rx="7" ry="4.5" fill="#FF9AAE" opacity=".8" />
      <ellipse cx="88" cy="79" rx="7" ry="4.5" fill="#FF9AAE" opacity=".8" />

      {cheer ? (
        <g stroke={EYE_DARK} strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M37 64 q8 -10 16 0" />
          <path d="M67 64 q8 -10 16 0" />
        </g>
      ) : (
        <>
          <ellipse cx="45" cy="63" rx="13" ry="15" fill={`url(#${id("eye")})`} />
          <ellipse cx="75" cy="63" rx="13" ry="15" fill={`url(#${id("eye")})`} />
          <g clipPath={`url(#${id("clip-eyes")})`}>
            <g className="pip-pupils" style={think ? { transform: "translate(2px,-4px)" } : undefined}>
              <circle cx="47" cy="65" r="7.5" fill={`url(#${id("pupil")})`} />
              <circle cx="73" cy="65" r="7.5" fill={`url(#${id("pupil")})`} />
              <circle cx="49.6" cy="61.8" r="2.7" fill="#fff" />
              <circle cx="75.6" cy="61.8" r="2.7" fill="#fff" />
              <circle cx="45" cy="68.5" r="1.1" fill="#fff" opacity=".8" />
              <circle cx="71" cy="68.5" r="1.1" fill="#fff" opacity=".8" />
            </g>
            {/* eyelids for blinking (body green, drop from the top) */}
            <g className="pip-lids" style={{ animationDelay: blinkDelay }}>
              <rect x="30" y="46" width="30" height="34" fill="#5CCB08" />
              <rect x="60" y="46" width="30" height="34" fill="#55C404" />
            </g>
          </g>
          {sad && (
            <g stroke="#3E9A00" strokeWidth="3.5" strokeLinecap="round">
              <path d="M34 51 L51 46" />
              <path d="M86 51 L69 46" />
            </g>
          )}
        </>
      )}

      {cheer && <path d="M47 82 q13 16 26 0 z" fill="#B8262F" />}
      {cheer && <path d="M53 88 q7 5 14 0" fill="#FF8FA0" />}
      {sad && <path d="M50 88 q10 -7 20 0" stroke={EYE_DARK} strokeWidth="4" strokeLinecap="round" fill="none" />}
      {think && <path d="M54 86 h11" stroke={EYE_DARK} strokeWidth="4" strokeLinecap="round" />}
      {mood === "happy" && <path d="M50 83 q10 9 20 0" stroke={EYE_DARK} strokeWidth="4" strokeLinecap="round" fill="none" />}
      {sad && <path className="pip-tear" d="M89 66 q4 8 0 12 q-4 -4 0 -12z" fill="#49C0F8" />}
    </g>
  );
}
