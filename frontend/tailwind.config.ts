import type { Config } from "tailwindcss";

// Design tokens. Every colour has a darker "edge" shade used for the chunky
// 3D bottom border on buttons and nodes.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Duolingo-style palette. 500 = fill, 600/700 = the darker "3D edge" shade.
        leaf: { 50: "#F1FFE6", 100: "#D7FFB8", 200: "#A5ED6E", 400: "#79D634", 500: "#58CC02", 600: "#58A700", 700: "#4A8F00" },
        ocean: { 50: "#DDF4FF", 100: "#BCE9FF", 400: "#49C0F8", 500: "#1CB0F6", 600: "#1899D6", 700: "#1482B8" },
        sun: { 50: "#FFF8DB", 100: "#FFF0B3", 400: "#FFD43B", 500: "#FFC800", 600: "#E5A800" },
        coral: { 50: "#FFF0F0", 100: "#FFDFE0", 400: "#FF7878", 500: "#FF4B4B", 600: "#EA2B2B", 700: "#C81F1F" },
        gem: { 50: "#E8FAFD", 400: "#4FD1E8", 500: "#1CB8D9", 600: "#1393AE" },
        flame: { 50: "#FFF3E0", 400: "#FFB020", 500: "#FF9600", 600: "#E07F00" },
        grape: { 50: "#F7EEFF", 400: "#DCA8FF", 500: "#CE82FF", 600: "#A568CC" },
        ink: { 50: "#F7F7F7", 100: "#F0F0F0", 200: "#E5E5E5", 300: "#CECECE", 400: "#AFAFAF", 500: "#777777", 700: "#4B4B4B", 900: "#3C3C3C" },
      },
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
