import Link from "next/link";

import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/Progress";
import type { Learner } from "@/lib/types";

export function ProfileHeader({ learner }: { learner: Learner }) {
  const joined = new Date(learner.joined_at).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const { level, xp_into_level, xp_for_next_level } = learner.level;
  return (
    <header className="relative flex flex-col items-center gap-5 rounded-3xl bg-gradient-to-br from-leaf-50 to-ocean-50 p-6 text-center sm:flex-row sm:text-left">
      <Link href="/settings" aria-label="Settings" className="absolute right-4 top-4 rounded-xl p-2 text-2xl hover:bg-surface/60">
        ⚙️
      </Link>
      <div className="relative">
        <Avatar name={learner.display_name} color={learner.avatar_color} size={112} />
        <span className="absolute -bottom-2 -right-2 rounded-xl border-2 border-white bg-grape-500 px-2 py-0.5 text-sm font-black text-white">
          Lv {level}
        </span>
      </div>
      <div className="w-full flex-1">
        <h1 className="flex flex-wrap items-center justify-center gap-2 text-3xl font-black sm:justify-start">
          {learner.display_name}
          <span className="rounded-lg bg-ocean-50 px-2 py-0.5 text-xs font-black uppercase tracking-wide text-ocean-800">
            Demo learner
          </span>
        </h1>
        <p className="mt-1 text-sm text-ink-500">The seeded default account. Sign-in is simplified, as the brief allows.</p>
        <p className="font-bold text-ink-500">
          @{learner.username} · Joined {joined}
          {learner.course && <> · {learner.course.language}</>}
        </p>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs font-black uppercase tracking-wide text-ink-500">
            <span>Level {level}</span>
            <span>{xp_into_level}/{xp_for_next_level} XP</span>
          </div>
          <ProgressBar value={xp_into_level / xp_for_next_level} color="ocean" label={`Progress to level ${level + 1}`} />
        </div>
      </div>
    </header>
  );
}
