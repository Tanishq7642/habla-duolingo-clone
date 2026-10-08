import type { UnitTheme } from "@/lib/types";

/** Visual identity per unit theme (content decides the key, UI decides the look). */
export const unitThemes: Record<UnitTheme, { banner: string; node: string; ring: string; text: string }> = {
  leaf: { banner: "bg-leaf-500 border-leaf-700", node: "bg-leaf-500 border-leaf-700", ring: "#3DBE5B", text: "!text-leaf-600" },
  sky: { banner: "bg-ocean-500 border-ocean-700", node: "bg-ocean-500 border-ocean-700", ring: "#2EA6F0", text: "!text-ocean-600" },
  sun: { banner: "bg-flame-500 border-flame-600", node: "bg-flame-500 border-flame-600", ring: "#FF8A1F", text: "!text-flame-600" },
};

export const themeFor = (theme: string) => unitThemes[theme as UnitTheme] ?? unitThemes.leaf;

/** Horizontal offsets (px) that make consecutive nodes wind like a trail. */
export const TRAIL_OFFSETS = [0, 48, 72, 48, 0, -48, -72, -48];
