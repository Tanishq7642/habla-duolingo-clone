/** Flat dumbbell illustration for Smart practice (original SVG, Duolingo-style). */
export function PracticeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect x="18" y="29" width="28" height="6" rx="3" fill="#AFAFAF" />
      <rect x="8" y="18" width="10" height="28" rx="4" fill="#1CB0F6" stroke="#1482B8" strokeWidth="2.5" />
      <rect x="46" y="18" width="10" height="28" rx="4" fill="#1CB0F6" stroke="#1482B8" strokeWidth="2.5" />
      <rect x="2" y="24" width="7" height="16" rx="3" fill="#49C0F8" stroke="#1482B8" strokeWidth="2.5" />
      <rect x="55" y="24" width="7" height="16" rx="3" fill="#49C0F8" stroke="#1482B8" strokeWidth="2.5" />
      <path d="M11 22v8M49 22v8" stroke="#BCE9FF" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
