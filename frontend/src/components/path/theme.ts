import type { UnitTheme } from "@/lib/types";

/** Visual identity per unit theme (content decides the key, UI decides the look). */
export const unitThemes: Record<UnitTheme, { banner: string; node: string; ring: string; text: string }> = {
  leaf: { banner: "bg-leaf-500 border-leaf-700", node: "bg-leaf-500 border-leaf-700", ring: "#58CC02", text: "!text-leaf-800" },
  sky: { banner: "bg-ocean-500 border-ocean-700", node: "bg-ocean-500 border-ocean-700", ring: "#1CB0F6", text: "!text-ocean-800" },
  sun: { banner: "bg-flame-500 border-flame-600", node: "bg-flame-500 border-flame-600", ring: "#FF9600", text: "!text-flame-800" },
};

export const themeFor = (theme: string) => unitThemes[theme as UnitTheme] ?? unitThemes.leaf;

/** Horizontal offsets (px) that make consecutive nodes wind like a trail. */
export const TRAIL_OFFSETS = [0, 48, 72, 48, 0, -48, -72, -48];
