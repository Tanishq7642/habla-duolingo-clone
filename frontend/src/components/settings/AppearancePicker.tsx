"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";

import { getThemePreference, setThemePreference, type ThemePreference } from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "☀️" },
  { value: "dark", label: "Dark", icon: "🌙" },
  { value: "system", label: "System", icon: "💻" },
];

export function AppearancePicker() {
  const [pref, setPref] = useState<ThemePreference>("system");
  useEffect(() => setPref(getThemePreference()), []);

  const choose = (value: ThemePreference) => {
    setPref(value);
    setThemePreference(value);
  };

  return (
    <section className="mt-8" aria-labelledby="appearance-title">
      <h2 id="appearance-title" className="text-lg font-black">Appearance</h2>
      <div role="radiogroup" aria-labelledby="appearance-title" className="mt-3 grid grid-cols-3 gap-3">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={pref === o.value}
            onClick={() => choose(o.value)}
            className={clsx(
              "flex flex-col items-center gap-1 rounded-2xl border-2 border-b-4 p-4 font-black transition active:translate-y-[2px] active:border-b-2",
              pref === o.value ? "border-ocean-400 bg-ocean-50 text-ocean-800" : "border-ink-200 hover:bg-ink-50",
            )}
          >
            <span className="text-2xl" aria-hidden>{o.icon}</span>
            {o.label}
          </button>
        ))}
      </div>
    </section>
  );
}
