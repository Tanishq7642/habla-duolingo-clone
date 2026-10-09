import type { UnitTheme } from "@/lib/types";

/** Glossy "candy" shading for a level node: highlight → base → shadow, plus the 3D edge below. */
export interface Candy {
  light: string;
  base: string;
  dark: string;
  edge: string;
}

interface UnitLook {
  banner: string;
  ring: string;
  text: string;
  candy: Candy;
}

/** Visual identity per unit theme (content decides the key, UI decides the look). */
export const unitThemes: Record<UnitTheme, UnitLook> = {
  leaf: {
    banner: "bg-leaf-500 border-leaf-700",
    ring: "#58CC02",
    text: "!text-leaf-600",
    candy: { light: "#A5ED5E", base: "#58CC02", dark: "#47A302", edge: "#3A8500" },
  },
  sky: {
    banner: "bg-ocean-500 border-ocean-700",
    ring: "#1CB0F6",
    text: "!text-ocean-600",
    candy: { light: "#8FDCFF", base: "#1CB0F6", dark: "#1899D6", edge: "#127FB3" },
  },
  sun: {
    banner: "bg-flame-500 border-flame-600",
    ring: "#FF9600",
    text: "!text-flame-600",
    candy: { light: "#FFD27A", base: "#FF9600", dark: "#E07F00", edge: "#B86800" },
  },
};

/** Completed levels turn gold; locked ones are grey (theme-aware via CSS variables). */
export const GOLD_CANDY: Candy = { light: "#FFF0A0", base: "#FFC800", dark: "#F0B000", edge: "#C99400" };
export const LOCKED_CANDY: Candy = {
  light: "rgb(var(--ink-100))",
  base: "rgb(var(--ink-200))",
  dark: "rgb(var(--ink-300))",
  edge: "rgb(var(--ink-300))",
};

export const themeFor = (theme: string) => unitThemes[theme as UnitTheme] ?? unitThemes.leaf;

/** Horizontal offsets (px) that make consecutive nodes wind like a trail. */
export const TRAIL_OFFSETS = [0, 56, 80, 56, 0, -56, -80, -56];
