/**
 * Light / dark theme. A display preference, so it lives in localStorage (not
 * the database). "system" follows the OS setting and is the default.
 */
export type ThemePreference = "light" | "dark" | "system";

export const THEME_KEY = "habla:theme";

export function getThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const saved = localStorage.getItem(THEME_KEY);
  return saved === "light" || saved === "dark" ? saved : "system";
}

export function resolveTheme(pref: ThemePreference): "light" | "dark" {
  if (pref !== "system") return pref;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(pref: ThemePreference) {
  const dark = resolveTheme(pref) === "dark";
  document.documentElement.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#131F24" : "#58CC02");
}

export function setThemePreference(pref: ThemePreference) {
  if (pref === "system") localStorage.removeItem(THEME_KEY);
  else localStorage.setItem(THEME_KEY, pref);
  applyTheme(pref);
}

/**
 * Inlined into <head> so the right theme is applied *before first paint*
 * (no white flash on dark-mode reloads). Must stay dependency-free.
 */
export const themeBootScript = `(function(){try{var p=localStorage.getItem("${THEME_KEY}");var d=p==="dark"||(p!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;
