import type { Config } from "tailwindcss";

import { palette } from "./scripts/palette.mjs";

function themeColors() {
  return Object.fromEntries(
    Object.entries(palette).map(([color, shades]) => [
      color,
      Object.fromEntries(
        Object.keys(shades).map((shade) => [
          shade,
          `rgb(var(--${shade === "DEFAULT" ? color : `${color}-${shade}`}) / <alpha-value>)`,
        ]),
      ),
    ]),
  );
}

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Every colour is a CSS variable (light/dark values in scripts/palette.mjs →
      // src/app/theme.css), so components never need `dark:` variants.
      colors: themeColors(),
      fontFamily: { sans: ["var(--font-nunito)", "ui-rounded", "system-ui", "sans-serif"] },
      borderRadius: { "4xl": "2rem" },
      keyframes: {
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "20%,60%": { transform: "translateX(-8px)" },
          "40%,80%": { transform: "translateX(8px)" },
        },
        pop: { "0%": { transform: "scale(.6)", opacity: "0" }, "70%": { transform: "scale(1.08)" }, "100%": { transform: "scale(1)", opacity: "1" } },
        "slide-up": { "0%": { transform: "translateY(100%)" }, "100%": { transform: "translateY(0)" } },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "heart-loss": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "40%": { transform: "scale(1.5) rotate(-12deg)" },
          "100%": { transform: "translateY(24px) scale(.4)", opacity: "0" },
        },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        "fly-up": {
          "0%": { transform: "translate(0,0) scale(1)", opacity: "1" },
          "100%": { transform: "translate(var(--fly-x), var(--fly-y)) scale(.5)", opacity: "0" },
        },
        confetti: {
          "0%": { transform: "translateY(-10vh) rotate(0)", opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(720deg)", opacity: "0.7" },
        },
        "pulse-ring": { "0%": { boxShadow: "0 0 0 0 rgba(61,190,91,.55)" }, "100%": { boxShadow: "0 0 0 18px rgba(61,190,91,0)" } },
        shimmer: { "0%": { backgroundPosition: "-400px 0" }, "100%": { backgroundPosition: "400px 0" } },
      },
      animation: {
        shake: "shake .45s ease-in-out",
        pop: "pop .35s cubic-bezier(.2,.9,.3,1.3) both",
        "slide-up": "slide-up .25s ease-out both",
        "fade-in": "fade-in .2s ease-out both",
        "heart-loss": "heart-loss .7s ease-in forwards",
        float: "float 3s ease-in-out infinite",
        "fly-up": "fly-up .9s cubic-bezier(.5,0,.75,0) forwards",
        confetti: "confetti linear forwards",
        "pulse-ring": "pulse-ring 1.6s ease-out infinite",
        shimmer: "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
