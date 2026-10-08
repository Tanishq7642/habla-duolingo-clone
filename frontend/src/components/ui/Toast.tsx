"use client";

import clsx from "clsx";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Tone = "success" | "error" | "info";
interface ToastItem { id: number; tone: Tone; message: string; icon?: string }

const ToastContext = createContext<(message: string, opts?: { tone?: Tone; icon?: string }) => void>(() => {});

export const useToast = () => useContext(ToastContext);

const tones: Record<Tone, string> = {
  success: "border-leaf-200 bg-leaf-50 text-leaf-800",
  error: "border-coral-100 bg-coral-50 text-coral-800",
  info: "border-ocean-100 bg-ocean-50 text-ocean-800",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, opts?: { tone?: Tone; icon?: string }) => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs, { id, message, tone: opts?.tone ?? "info", icon: opts?.icon }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={clsx("animate-pop rounded-2xl border-2 px-4 py-3 text-sm font-bold shadow-lg", tones[t.tone])}
          >
            {t.icon && <span className="mr-2">{t.icon}</span>}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
