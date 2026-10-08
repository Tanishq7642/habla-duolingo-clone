import type { CourseRef } from "@/lib/types";

/**
 * Flag emoji don't render on Windows (they show as letters), so known course
 * languages get a tiny inline SVG; anything else falls back to the emoji.
 */
const FLAGS: Record<string, React.ReactNode> = {
  Spanish: (
    <>
      <rect width="30" height="20" fill="#C60B1E" />
      <rect y="5" width="30" height="10" fill="#FFC400" />
    </>
  ),
};

export function CourseFlag({ course, size = 28 }: { course: CourseRef; size?: number }) {
  const svg = FLAGS[course.language];
  if (!svg) return <span aria-hidden>{course.flag}</span>;
  return (
    <svg viewBox="0 0 30 20" width={size} height={(size * 2) / 3} className="rounded-[5px] border-2 border-ink-200" aria-hidden>
      {svg}
    </svg>
  );
}
