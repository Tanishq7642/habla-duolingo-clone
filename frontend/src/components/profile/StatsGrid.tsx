import type { Stats } from "@/lib/types";

export function StatsGrid({ stats }: { stats: Stats }) {
  const { learner } = stats;
  const items = [
    { icon: "🔥", value: learner.streak.current, label: "Day streak" },
    { icon: "🏔️", value: learner.streak.longest, label: "Best streak" },
    { icon: "⚡", value: learner.total_xp, label: "Total XP" },
    { icon: "📘", value: stats.lessons_completed, label: "Lessons" },
    { icon: "🎯", value: stats.perfect_lessons, label: "Perfect" },
    { icon: "🏅", value: `${stats.skills_completed}/${stats.skills_total}`, label: "Skills" },
    { icon: "💪", value: stats.practice_sessions, label: "Practices" },
    { icon: "💎", value: learner.gems, label: "Gems" },
  ];
  return (
    <section aria-labelledby="stats-title">
      <h2 id="stats-title" className="mb-4 text-2xl font-black">Statistics</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((s) => (
          <li key={s.label} className="flex items-center gap-3 rounded-2xl border-2 border-ink-100 p-4">
            <span className="text-3xl" aria-hidden>{s.icon}</span>
            <div className="flex min-w-0 flex-col-reverse">
              <p className="truncate text-xs font-bold text-ink-400">{s.label}</p>
              <p className="text-xl font-black tabular-nums">{s.value}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
