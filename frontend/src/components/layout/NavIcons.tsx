/**
 * Sidebar / tab-bar icons drawn in the style of Duolingo's navigation:
 * flat, chunky, bright fills with a darker outline and a soft highlight.
 * Original artwork (no Duolingo assets), pure SVG, theme-independent colours.
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 32, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden {...rest}>
      {children}
    </svg>
  );
}

const OUTLINE = { stroke: "#4B3A2A", strokeWidth: 1.6, strokeLinejoin: "round" as const };

export function LearnIcon(p: IconProps) {
  return (
    <Icon {...p}>
      {/* walls */}
      <path d="M7 14.5h18V27a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 7 27z" fill="#FFD43B" {...OUTLINE} />
      {/* door */}
      <path d="M13.5 28.5v-7a2.5 2.5 0 0 1 5 0v7z" fill="#C47A2C" {...OUTLINE} />
      {/* roof */}
      <path d="M3.5 15.5 16 4l12.5 11.5a1.4 1.4 0 0 1-1.9 2L16 7.9 5.4 17.5a1.4 1.4 0 0 1-1.9-2z" fill="#FF4B4B" {...OUTLINE} />
      <path d="M9 12.5 16 6.3" stroke="#FFA3A3" strokeWidth="1.4" strokeLinecap="round" />
      {/* window */}
      <rect x="20" y="17.5" width="3.2" height="3.2" rx="0.8" fill="#8EE4FF" stroke="#4B3A2A" strokeWidth="1.2" />
    </Icon>
  );
}

export function LeaderboardIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M16 3.5 26.5 7v8.6c0 6-4.4 10.4-10.5 13-6.1-2.6-10.5-7-10.5-13V7z" fill="#FFC800" stroke="#B57E00" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M16 6.4 23.8 9v6.6c0 4.4-3.1 7.8-7.8 9.9z" fill="#FFAE00" />
      <path d="m16 10.2 1.7 3.5 3.8.5-2.8 2.6.7 3.8L16 18.8l-3.4 1.8.7-3.8-2.8-2.6 3.8-.5z" fill="#FFFFFF" stroke="#B57E00" strokeWidth="1" strokeLinejoin="round" />
    </Icon>
  );
}

export function QuestsIcon(p: IconProps) {
  return (
    <Icon {...p}>
      {/* lid */}
      <path d="M5 13.5a6 6 0 0 1 6-6h10a6 6 0 0 1 6 6v1H5z" fill="#E0892F" {...OUTLINE} />
      {/* body */}
      <rect x="5" y="14.5" width="22" height="12.5" rx="2" fill="#C47A2C" {...OUTLINE} />
      {/* metal bands */}
      <path d="M11 7.8V27M21 7.8V27" stroke="#FFC800" strokeWidth="2.4" />
      {/* lock */}
      <rect x="13.2" y="12" width="5.6" height="6.4" rx="1.4" fill="#FFC800" stroke="#4B3A2A" strokeWidth="1.3" />
      <circle cx="16" cy="15.2" r="1" fill="#4B3A2A" />
      <path d="M8 10.5c1-1.4 2.3-1.9 3.6-1.9" stroke="#F6B26B" strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </Icon>
  );
}

export function ShopIcon(p: IconProps) {
  return (
    <Icon {...p}>
      {/* stall */}
      <rect x="6" y="14" width="20" height="14" rx="1.5" fill="#FFFFFF" {...OUTLINE} />
      <rect x="13" y="19" width="6" height="9" rx="1" fill="#1CB0F6" stroke="#4B3A2A" strokeWidth="1.3" />
      {/* striped awning */}
      <path d="M4 9.5 6.5 4h19L28 9.5v1.2a2.6 2.6 0 0 1-4.8 1.4 2.6 2.6 0 0 1-4.8 0 2.6 2.6 0 0 1-4.8 0 2.6 2.6 0 0 1-4.8 0A2.6 2.6 0 0 1 4 10.7z" fill="#FF4B4B" {...OUTLINE} />
      <path d="M11.3 4 10.4 12M16 4v8.6M20.7 4l.9 8" stroke="#FFFFFF" strokeWidth="2.2" />
    </Icon>
  );
}

export function ProfileIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="16" cy="16" r="12.5" fill="#CE82FF" stroke="#7339A0" strokeWidth="1.6" />
      <circle cx="16" cy="13" r="4.6" fill="#FFFFFF" />
      <path d="M8.2 24.6c1.6-3.6 4.4-5.4 7.8-5.4s6.2 1.8 7.8 5.4A12.4 12.4 0 0 1 16 28.5c-3 0-5.7-1.4-7.8-3.9z" fill="#FFFFFF" />
      <path d="M8.5 9.5A9.5 9.5 0 0 1 13 5.6" stroke="#E7C2FF" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </Icon>
  );
}

export function MoreIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="16" cy="16" r="12.5" fill="#FF86C8" stroke="#C2457F" strokeWidth="1.6" />
      <circle cx="10" cy="16" r="2.2" fill="#FFFFFF" />
      <circle cx="16" cy="16" r="2.2" fill="#FFFFFF" />
      <circle cx="22" cy="16" r="2.2" fill="#FFFFFF" />
    </Icon>
  );
}
