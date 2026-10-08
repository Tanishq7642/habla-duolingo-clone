import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { applyTheme, getThemePreference, resolveTheme, setThemePreference, themeBootScript } from "./theme";

const mockSystem = (dark: boolean) =>
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: dark && q.includes("dark"), media: q }));

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});
afterEach(() => vi.unstubAllGlobals());

describe("theme", () => {
  it("defaults to following the system", () => {
    expect(getThemePreference()).toBe("system");
    mockSystem(true);
    expect(resolveTheme("system")).toBe("dark");
    mockSystem(false);
    expect(resolveTheme("system")).toBe("light");
  });

  it("an explicit choice wins over the system and persists", () => {
    mockSystem(false);
    setThemePreference("dark");
    expect(getThemePreference()).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
    setThemePreference("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("choosing system forgets the saved choice", () => {
    mockSystem(true);
    setThemePreference("light");
    setThemePreference("system");
    expect(localStorage.getItem("habla:theme")).toBeNull();
    expect(document.documentElement).toHaveClass("dark");
  });

  it("the pre-paint boot script applies the same rule", () => {
    mockSystem(false);
    localStorage.setItem("habla:theme", "dark");
    new Function(themeBootScript)();
    expect(document.documentElement).toHaveClass("dark");
    applyTheme("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });
});
