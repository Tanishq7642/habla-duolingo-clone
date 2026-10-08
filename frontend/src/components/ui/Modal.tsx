"use client";

import clsx from "clsx";
import { useEffect, useId, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  /** Hide the title visually (still announced to screen readers). */
  hideTitle?: boolean;
}

/** Accessible dialog: focus moves in, Escape closes, focus is restored on close. */
export function Modal({ open, onClose, title, children, className, hideTitle }: ModalProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const first = panel.current?.querySelector<HTMLElement>("button, [href], input, [tabindex]:not([tabindex='-1'])");
    (first ?? panel.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
      <div className="absolute inset-0 animate-fade-in bg-ink-900/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={clsx(
          "relative z-10 w-full max-w-md animate-pop rounded-t-4xl bg-white p-6 shadow-2xl outline-none sm:rounded-4xl sm:p-8",
          className,
        )}
      >
        <h2 id={titleId} className={clsx("text-2xl font-black text-ink-900", hideTitle && "sr-only")}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
