"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";

const LOCALES: Record<string, string> = { es: "es-ES", en: "en-US" };

/** Reads text aloud with the browser's built-in speech synthesis (no network, no assets). */
export function SpeakButton({ text, lang = "es", className }: { text: string; lang?: string; className?: string }) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => setSupported(typeof window !== "undefined" && "speechSynthesis" in window), []);
  if (!supported) return null;

  const speak = () => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LOCALES[lang] ?? lang;
    u.rate = 0.9;
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  return (
    <button
      type="button"
      onClick={speak}
      aria-label={`Listen to “${text}”`}
      className={clsx(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-b-4 border-ocean-600 bg-ocean-500 text-white",
        "transition active:translate-y-[2px] active:border-b-2 hover:bg-ocean-400",
        speaking && "animate-pulse",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />
      </svg>
    </button>
  );
}
