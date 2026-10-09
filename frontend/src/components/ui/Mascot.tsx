"use client";

import clsx from "clsx";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";

import { rem } from "@/lib/units";

export type MascotMood = "happy" | "cheer" | "sad" | "think";

interface Props {
  mood?: MascotMood;
  size?: number;
  className?: string;
  /** Head/eye follow the pointer and a click makes Pico hop. */
  interactive?: boolean;
  /** Which way Pico looks (artwork faces left; "right" mirrors it). */
  facing?: "left" | "right";
  /** Kept for API compatibility: Pico is always animated. */
  float?: boolean;
}

const INK = "#1F2326";

/*
 * Artwork (viewBox 120 x 130), a scarlet macaw in a 3/4 view perched on a branch.
 * It is rigged like a 2D game character: separate parts that move on their own
 * pivots (head on the neck, wing on the shoulder, tail at its base), which is
 * what makes it read as 3D when animated (`.mascot-*` in globals.css).
 */
/** Neck, chest, back and belly (the head sits on top as its own part). */
const BODY =
  "M57 30 C68 30 72 41 72 54 C77 66 77 82 71 94 C66 100 58 102 52 100 " +
  "C42 96 36 86 36 74 C36 63 41 55 44 48 C45 39 50 30 57 30Z";
/** Head: round crown, cheek and throat. */
const HEAD = "M51 12 C63 10 73 19 73 31 C73 42 66 50 56 51 C46 52 36 44 36 32 C36 21 43 13 51 12Z";
/** Folded wing along the back: red coverts, yellow band, long blue flight feathers. */
const WING = {
  blue: "M63 45 C78 49 84 72 81 106 C74 97 67 84 63 70 C61 60 61 52 63 45Z",
  yellow: "M63 45 C75 48 80 60 79 74 C73 68 66 62 63 56 C62 52 62 48 63 45Z",
  red: "M63 45 C72 46 77 52 77 60 C71 57 66 53 63 50Z",
  lines: "M68 74 C72 84 75 94 78 102 M66 66 C69 76 71 86 73 94",
};
/** Long, tapering tail feathers. */
const TAIL = {
  red: "M64 92 C72 104 82 117 95 130 C88 131 79 124 70 112 C66 106 63 99 64 92Z",
  blue: "M68 92 C78 102 90 113 104 124 C98 127 86 121 76 110 C72 105 69 99 68 92Z",
};

/**
 * "Pico" – Habla's mascot, a scarlet macaw (pico = "beak" in Spanish).
 * Animated Duolingo-style with CSS only: breathing, blinking, a curious parrot
 * head tilt, head bobs, wing flaps, tail sway and a bounce. Interactive mascots
 * turn their head towards the pointer (the face shifts more than the head: a
 * parallax "3D" turn) and hop when clicked. Original artwork; no Duolingo assets.
 */
export function Mascot({ mood = "happy", size = 96, className, interactive, facing = "left" }: Props) {
  const uid = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const [hopKey, setHopKey] = useState(0);
  const id = (name: string) => `${name}-${uid}`;
  const url = (name: string) => `url(#${id(name)})`;
  const mirrored = facing === "right";

  // Deterministic per-instance timing so several mascots don't move in sync
  // (derived from useId, so server and client render the same values).
  const seed = [...uid].reduce((n, ch) => n + ch.charCodeAt(0), 0);
  const delay = (mod: number, add = 0) => `${(seed % mod) / 10 + add}s`;

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
        const dx = (e.clientX - (box.left + box.width * 0.4)) * (mirrored ? -1 : 1); // in artwork space
        const dy = e.clientY - (box.top + box.height * 0.25);
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
  }, [interactive, mirrored]);

  const hop = (e: MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    setHopKey((k) => k + 1); // re-mounting the group restarts the hop animation
  };

  const label =
    mood === "cheer" ? "Pico is cheering" : mood === "sad" ? "Pico looks sad" : mood === "think" ? "Pico is thinking" : "Pico, the Habla mascot";

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 120 130"
      style={{ width: rem(size), height: rem(size * (130 / 120)), ["--mascot-delay" as string]: delay(29) }}
      role="img"
      aria-label={label}
      onClick={hop}
      className={clsx("mascot overflow-visible", `mascot-${mood}`, interactive ? "mascot-interactive cursor-pointer" : "mascot-idle", className)}
    >
      <defs>
        {/* volumes: every part lit from the top-left, falling off to deep red at the back */}
        <radialGradient id={id("body")} cx="0.3" cy="0.25" r="0.9">
          <stop offset="0" stopColor="#FF7A63" />
          <stop offset="0.45" stopColor="#EE3A2C" />
          <stop offset="1" stopColor="#B51C14" />
        </radialGradient>
        <radialGradient id={id("head")} cx="0.35" cy="0.25" r="0.8">
          <stop offset="0" stopColor="#FF876F" />
          <stop offset="0.5" stopColor="#F0402F" />
          <stop offset="1" stopColor="#BF2017" />
        </radialGradient>
        <radialGradient id={id("mask")} cx="0.55" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FBE3DA" />
        </radialGradient>
        <linearGradient id={id("beak")} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#FFFBF0" />
          <stop offset="0.55" stopColor="#F0D9B0" />
          <stop offset="1" stopColor="#B99467" />
        </linearGradient>
        <linearGradient id={id("jaw")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4A4E52" />
          <stop offset="1" stopColor="#1E2124" />
        </linearGradient>
        <linearGradient id={id("blue")} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#47B2FA" />
          <stop offset="1" stopColor="#1763C7" />
        </linearGradient>
        <linearGradient id={id("yellow")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE65C" />
          <stop offset="1" stopColor="#FFB300" />
        </linearGradient>
        <linearGradient id={id("tailRed")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E8352A" />
          <stop offset="1" stopColor="#A9180F" />
        </linearGradient>
        <radialGradient id={id("eye")} cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.8" stopColor="#F7F7F7" />
          <stop offset="1" stopColor="#DCDCDC" />
        </radialGradient>
        <radialGradient id={id("iris")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF6C8" />
          <stop offset="1" stopColor="#E3BE45" />
        </radialGradient>
        <linearGradient id={id("feet")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A3A9AF" />
          <stop offset="1" stopColor="#5F656B" />
        </linearGradient>
        <linearGradient id={id("branch")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A9713F" />
          <stop offset="1" stopColor="#6E4422" />
        </linearGradient>
        <radialGradient id={id("shine")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity=".6" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("ao")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#5A0805" stopOpacity=".45" />
          <stop offset="1" stopColor="#5A0805" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id("clip-body")}>
          <path d={BODY} />
        </clipPath>
        <clipPath id={id("clip-head")}>
          <path d={HEAD} />
        </clipPath>
        <clipPath id={id("clip-eye")}>
          <ellipse cx="51" cy="29" rx="6.5" ry="7" />
        </clipPath>
      </defs>

      <g transform={mirrored ? "matrix(-1 0 0 1 120 0)" : undefined}>
        {/* the perch: stays put while Pico bobs and hops */}
        <path d="M2 102 C30 97 72 99 118 103 L118 109 C72 106 30 105 2 108Z" fill={url("branch")} />
        <path d="M8 104 C30 101 60 101 90 103" stroke="#C99A6B" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity=".6" />
        <path d="M14 103 C8 95 10 88 17 86 C19 93 18 99 14 103Z" fill="#58CC02" />
        <path d="M14 103 C14 97 15 92 17 87" stroke="#3F9E00" strokeWidth="1" fill="none" />

        <g key={hopKey} className={clsx("mascot-root", hopKey > 0 && "mascot-hop")}>
          {/* tail: sways from its base, behind everything */}
          <g className="mascot-tail" style={{ animationDelay: delay(31) }}>
            <path d={TAIL.blue} fill={url("blue")} />
            <path d={TAIL.red} fill={url("tailRed")} />
          </g>

          <g className="mascot-body">
            {/* body volume: rim shadow at the back, chest feathers, soft highlight */}
            <path d={BODY} fill={url("body")} />
            <g clipPath={url("clip-body")}>
              <ellipse cx="74" cy="78" rx="9" ry="34" fill="#6E0B06" opacity=".22" />
              <ellipse cx="44" cy="70" rx="5" ry="18" fill="#FF9C86" opacity=".35" />
              <path d="M42 66 q4 3 8 0 M40 75 q4 3 8 0 M48 72 q4 3 8 0 M44 84 q4 3 8 0" stroke="#B51C14" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".45" />
              {/* the head's shadow on the neck (ambient occlusion) */}
              <ellipse cx="56" cy="50" rx="16" ry="6" fill={url("ao")} />
            </g>

            {/* wing: flaps from the shoulder */}
            <g className="mascot-wing" style={{ animationDelay: delay(23, 2) }}>
              <path d={WING.blue} fill={url("blue")} />
              <path d={WING.yellow} fill={url("yellow")} />
              <path d={WING.red} fill="#D52A1F" />
              <path d={WING.lines} stroke="#0F4C99" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".6" />
              <path d="M65 48 C72 49 76 53 77 58" stroke="#FF9C86" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity=".7" />
            </g>

            {/* head: tilts and bobs on the neck; the face inside shifts further (parallax) */}
            <g className="mascot-head" style={{ animationDelay: delay(41) }}>
              <path d={HEAD} fill={url("head")} />
              <g clipPath={url("clip-head")}>
                <ellipse cx="70" cy="34" rx="6" ry="18" fill="#6E0B06" opacity=".2" />
                <ellipse className="mascot-shine" cx="54" cy="18" rx="11" ry="5" fill={url("shine")} transform="rotate(-12 54 18)" />
              </g>
              <g className="mascot-face">
                <Face mood={mood} blinkDelay={delay(37)} url={url} />
              </g>
            </g>
          </g>

          {/* zygodactyl feet gripping the perch, drawn over the branch */}
          <g fill={url("feet")}>
            <path d="M47 99 C45 101 44 104 46 106 C48 106 49 103 50 100Z" />
            <path d="M52 99 C51 102 51 105 53 106 C55 105 55 102 55 99Z" />
            <path d="M58 99 C57 102 57 105 59 106 C61 105 61 102 61 99Z" />
            <path d="M63 99 C63 102 64 105 66 105 C67 103 66 101 65 99Z" />
          </g>
        </g>
      </g>
    </svg>
  );
}

function Face({ mood, blinkDelay, url }: { mood: MascotMood; blinkDelay: string; url: (n: string) => string }) {
  const cheer = mood === "cheer";
  const sad = mood === "sad";
  const think = mood === "think";
  return (
    <g>
      {/* bare white facial patch from the eye to the beak, with the fine feather lines macaws have */}
      <path d="M36 25 C41 18 54 18 58 25 C61 31 58 39 52 42 C47 44 39 43 36 38 C34 34 34 29 36 25Z" fill={url("mask")} />
      <g stroke="#E0453A" strokeWidth="1" strokeLinecap="round" opacity=".5">
        <path d="M41 38 l3 0.5 M45 40.5 l3 0.3 M40 34 l2.5 0.6" />
      </g>

      {cheer ? (
        <path d="M45.5 30 q5.5 -6 11 0" stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      ) : (
        <>
          <ellipse cx="51" cy="29" rx="6.5" ry="7" fill={url("eye")} />
          <g clipPath={url("clip-eye")}>
            <g className="mascot-pupils" style={think ? { transform: "translate(1px,-2.5px)" } : sad ? { transform: "translate(0,1.5px)" } : undefined}>
              <circle cx="50" cy="29.5" r="4.6" fill={url("iris")} />
              <circle cx="50" cy="29.5" r="2.9" fill={INK} />
              <circle cx="51.4" cy="27.8" r="1.25" fill="#fff" />
            </g>
            {/* eyelid for blinking (face-patch colour, drops from the top) */}
            <rect className="mascot-lids" style={{ animationDelay: blinkDelay }} x="43" y="21" width="16" height="16" fill="#FFF1EC" />
          </g>
          <ellipse cx="51" cy="29" rx="6.5" ry="7" fill="none" stroke="#D8C6BF" strokeWidth=".8" />
          {sad && <path d="M44 21.5 L56 19" stroke="#A81C14" strokeWidth="2.2" strokeLinecap="round" />}
          {think && <path d="M45 20 q6 -4 12 0" stroke="#A81C14" strokeWidth="2" strokeLinecap="round" fill="none" />}
        </>
      )}

      {/* lower mandible (drops open when cheering), then the hooked upper mandible over it */}
      <g transform={cheer ? "rotate(16 41 44)" : undefined}>
        <path d="M33 45 C35 50 39 52 43 50 C44 47 42 44 39 43Z" fill={url("jaw")} />
        {cheer && <path d="M35 46.5 C37 49.5 40 50 42.5 48.5 C41.5 46.5 39 45.5 35 46.5Z" fill="#FF7E95" />}
      </g>
      <path d="M43 22 C34 19 24 26 22 37 C21 45 24 52 29 56 C28 50 29 46 32 44 C35 42 40 42 44 41 C43 34 45 27 43 22Z" fill={url("beak")} />
      {/* beak volume: highlight along the ridge, shadow under the hook */}
      <path d="M39 23.5 C31 23 26 28 25 35" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" fill="none" opacity=".85" />
      <path d="M26 45 C26 49 27 52 29 55" stroke="#9C7A4E" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity=".6" />
      {sad && <path className="mascot-tear" d="M54 37 q3 6 0 9 q-3 -3 0 -9z" fill="#49C0F8" />}
    </g>
  );
}
