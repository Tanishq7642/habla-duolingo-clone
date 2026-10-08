"use client";

import clsx from "clsx";
import { useState } from "react";

import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Button } from "@/components/ui/Button";
import { Confetti } from "@/components/ui/Confetti";
import { CrownBadge } from "@/components/ui/Crown";
import { Mascot } from "@/components/ui/Mascot";
import { ProgressBar } from "@/components/ui/Progress";
import type { Completion } from "@/lib/types";

import { MistakeReview } from "./MistakeReview";

interface Props {
  completion: Completion;
  onContinue: () => void;
}

export function LessonComplete({ completion: c, onContinue }: Props) {
  const [reviewing, setReviewing] = useState(false);
  const title = c.kind === "practice" ? "Practice complete!" : c.perfect ? "Perfect lesson!" : "Lesson complete!";

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {!c.already_completed && <Confetti />}
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-6 px-5 pb-8 pt-10 text-center">
        <Mascot mood="cheer" size={150} interactive className="animate-pop" />
        <div>
          <h1 className="text-3xl font-black text-sun-800 sm:text-4xl">{title}</h1>
          {c.level.leveled_up && (
            <p className="mt-2 animate-pop font-extrabold text-grape-800">⬆ You reached level {c.level.level}!</p>
          )}
        </div>

        <div className="grid w-full grid-cols-3 gap-3">
          <StatTile label="Total XP" tone="sun" icon="⚡">
            <AnimatedNumber value={c.xp.total} from={0} />
          </StatTile>
          <StatTile label={accuracyLabel(c.accuracy)} tone="leaf" icon="🎯">
            {c.accuracy}%
          </StatTile>
          <StatTile label={c.duration_seconds <= SPEEDY_SECONDS ? "Speedy" : "Committed"} tone="ocean" icon="⏱️">
            {formatDuration(c.duration_seconds)}
          </StatTile>
        </div>

        <p className="-mt-2 text-sm font-bold text-ink-500">
          {c.xp.base} XP from exercises + {c.xp.bonus} bonus{c.perfect && c.kind === "lesson" ? " (incl. perfect bonus)" : ""}
          {c.gems_awarded > 0 && <> · +{c.gems_awarded} 💎</>}
          {c.hearts_awarded > 0 && <> · +{c.hearts_awarded} ❤️</>}
        </p>

        <section aria-label="Progress" className="w-full space-y-3 text-left">
          <Row icon="🔥" title={`${c.streak.current}-day streak`} highlight={c.streak.extended}>
            {c.streak.extended ? "Streak extended – see you tomorrow!" : "Already practised today. Keep it up!"}
          </Row>
          <Row icon="🎯" title="Daily goal" highlight={c.daily_goal.just_reached}>
            <div className="mt-2 flex items-center gap-3">
              <ProgressBar value={c.daily_goal.xp_today / c.daily_goal.goal_xp} color="sun" label="Daily goal" />
              <span className="shrink-0 text-sm font-extrabold text-ink-500">
                {c.daily_goal.xp_today}/{c.daily_goal.goal_xp} XP
              </span>
            </div>
            {c.daily_goal.just_reached && <p className="mt-1 font-bold text-sun-800">Daily goal reached! 🎉</p>}
          </Row>
          {c.skill && (
            <Row icon={c.skill.icon} title={c.skill.title} highlight={c.skill.just_completed}>
              <div className="mt-2 flex items-center gap-3">
                <ProgressBar value={c.skill.lessons_completed / c.skill.lessons_total} label={`${c.skill.title} progress`} />
                <span className="shrink-0 text-sm font-extrabold text-ink-500">
                  {c.skill.lessons_completed}/{c.skill.lessons_total}
                </span>
              </div>
              {c.skill.completed && (
                <p className="mt-1 flex items-center gap-2 text-sm font-bold text-ink-500">
                  <CrownBadge level={c.skill.mastery} max={c.skill.mastery_cap} /> Crown level {c.skill.mastery} of {c.skill.mastery_cap}
                </p>
              )}
            </Row>
          )}
          {c.unlocked_skill && (
            <div className="flex animate-pop items-center gap-3 rounded-2xl border-2 border-ocean-100 bg-ocean-50 p-4">
              <span className="text-3xl" aria-hidden>🔓</span>
              <p className="font-extrabold text-ocean-800">
                New skill unlocked: {c.unlocked_skill.icon} {c.unlocked_skill.title}
              </p>
            </div>
          )}
          {c.achievements.map((a) => (
            <div key={a.code} className="flex animate-pop items-center gap-3 rounded-2xl border-2 border-grape-400/30 bg-grape-50 p-4">
              <span className="text-3xl" aria-hidden>{a.icon}</span>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-grape-800">Achievement unlocked</p>
                <p className="font-extrabold text-ink-900">{a.title}</p>
                <p className="text-sm text-ink-500">{a.description}</p>
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="sticky bottom-0 border-t-2 border-ink-100 bg-surface">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-3 px-5 py-4 sm:flex-row">
          {c.mistakes > 0 && (
            <Button variant="ghost" block onClick={() => setReviewing(true)}>
              Review {c.mistakes === 1 ? "mistake" : `${c.mistakes} mistakes`}
            </Button>
          )}
          <Button block onClick={onContinue} autoFocus>
            Continue
          </Button>
        </div>
      </footer>
      <MistakeReview attemptId={reviewing ? c.attempt_id : null} onClose={() => setReviewing(false)} />
    </div>
  );
}

/** Same idea as Duolingo's end-of-lesson tiles: a word for how it went, then the number. */
const SPEEDY_SECONDS = 120;
const accuracyLabel = (pct: number) => (pct === 100 ? "Amazing" : pct >= 80 ? "Great" : "Good");
export const formatDuration = (s: number) =>
  s >= 3600 ? "60:00+" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const tileTones = {
  sun: "border-sun-500 bg-sun-500",
  leaf: "border-leaf-500 bg-leaf-500",
  gem: "border-gem-500 bg-gem-500",
  coral: "border-coral-500 bg-coral-500",
  ocean: "border-ocean-500 bg-ocean-500",
};

function StatTile({ label, tone, icon, children }: { label: string; tone: keyof typeof tileTones; icon: string; children: React.ReactNode }) {
  return (
    <div className={clsx("animate-pop overflow-hidden rounded-2xl border-2", tileTones[tone])}>
      <p className="py-1 text-[0.6875rem] font-black uppercase tracking-wider text-white">{label}</p>
      <p className="flex items-center justify-center gap-1.5 rounded-xl bg-surface py-3 text-xl font-black text-ink-900">
        <span aria-hidden>{icon}</span>
        {children}
      </p>
    </div>
  );
}

function Row({ icon, title, highlight, children }: { icon: string; title: string; highlight?: boolean; children: React.ReactNode }) {
  return (
    <div className={clsx("flex gap-3 rounded-2xl border-2 p-4", highlight ? "border-sun-400 bg-sun-50" : "border-ink-100")}>
      <span className="text-2xl" aria-hidden>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold text-ink-900">{title}</p>
        <div className="text-sm text-ink-500">{children}</div>
      </div>
    </div>
  );
}
