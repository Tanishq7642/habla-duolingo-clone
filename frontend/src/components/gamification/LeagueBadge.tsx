import clsx from "clsx";

import { rem } from "@/lib/units";

/** League tiers shown on the weekly leaderboard (presentation only; rankings are real data). */
export const LEAGUES = [
  { name: "Bronze", fill: "#CD7F32", edge: "#8C5A21" },
  { name: "Silver", fill: "#C3CBD6", edge: "#8A94A3" },
  { name: "Gold", fill: "#FFC800", edge: "#B57E00" },
  { name: "Sapphire", fill: "#1CB0F6", edge: "#1482B8" },
  { name: "Ruby", fill: "#FF4B4B", edge: "#C81F1F" },
] as const;

export function LeagueBadge({ league, size = 56, dim, className }: { league: (typeof LEAGUES)[number]; size?: number; dim?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      style={{ width: rem(size), height: rem(size) }}
      className={clsx(dim && "opacity-35 grayscale-[60%]", className)}
      role="img"
      aria-label={`${league.name} league`}
    >
      <path d="M16 2.5 27.5 6.4v9.4c0 6.6-4.8 11.4-11.5 14.2C9.3 27.2 4.5 22.4 4.5 15.8V6.4z" fill={league.fill} stroke={league.edge} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16 5.6 24.6 8.5v7.3c0 4.9-3.4 8.6-8.6 10.9z" fill="#000" opacity=".1" />
      <path d="m16 10.4 1.8 3.7 4 .6-2.9 2.8.7 4L16 19.6l-3.6 1.9.7-4-2.9-2.8 4-.6z" fill="#fff" stroke={league.edge} strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}
