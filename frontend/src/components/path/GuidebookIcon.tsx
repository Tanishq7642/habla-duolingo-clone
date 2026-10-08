/** Ring-bound notebook glyph for the unit "Guidebook" button (original SVG). */
export function GuidebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <rect x="6" y="2.5" width="14" height="19" rx="3" />
      {/* binding rings */}
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M3.5 6.5h4M3.5 10.5h4M3.5 14.5h4M3.5 18.5h4" />
      </g>
      {/* page lines (cut-outs in the cover) */}
      <g stroke="#000" strokeOpacity=".22" strokeWidth="2" strokeLinecap="round">
        <path d="M10.5 8h6M10.5 12h6M10.5 16h4" />
      </g>
    </svg>
  );
}
