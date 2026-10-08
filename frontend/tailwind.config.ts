import type { Config } from "tailwindcss";

// Design tokens. Every colour has a darker "edge" shade used for the chunky
// 3D bottom border on buttons and nodes.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        leaf: { 50: "#EEFBEF", 100: "#D5F5D9", 200: "#AEEBB8", 400: "#5BD16F", 500: "#3DBE5B", 600: "#2FA34B", 700: "#23853B" },
        ocean: { 50: "#EAF6FE", 100: "#CDEBFC", 400: "#4DB8F5", 500: "#2EA6F0", 600: "#1C89CC", 700: "#146CA3" },
        sun: { 50: "#FFF8E6", 100: "#FFEDC2", 400: "#FFC547", 500: "#FFB020", 600: "#E59400" },
        coral: { 50: "#FFF0F0", 100: "#FFD9DB", 400: "#FF7B7F", 500: "#FF4B55", 600: "#E0353F", 700: "#B8262F" },
        gem: { 50: "#E8FAFD", 400: "#4FD1E8", 500: "#1CB8D9", 600: "#1393AE" },
        flame: { 50: "#FFF3E8", 400: "#FFA24D", 500: "#FF8A1F", 600: "#E5700A" },
        grape: { 50: "#F3EFFF", 400: "#9B7BFF", 500: "#7C5CFF", 600: "#6142E0" },
        ink: { 50: "#F7F9FB", 100: "#EEF2F6", 200: "#DCE3EB", 300: "#B7C2D0", 400: "#8D9AAB", 500: "#6B7A8F", 700: "#3C4A5C", 900: "#1F2A37" },
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
