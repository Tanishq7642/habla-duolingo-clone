"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { DemoTools } from "@/components/settings/DemoTools";
import { Button } from "@/components/ui/Button";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { useLearner, useUpdateSettings } from "@/lib/queries";
import { isMuted, setMuted } from "@/lib/sfx";

const GOALS = [
  { xp: 10, label: "Casual", hint: "~5 min / day" },
  { xp: 20, label: "Regular", hint: "~10 min / day" },
  { xp: 30, label: "Serious", hint: "~15 min / day" },
  { xp: 50, label: "Intense", hint: "~25 min / day" },
];

export default function SettingsPage() {
  const me = useLearner();
  const update = useUpdateSettings();
  const toast = useToast();
  const [goal, setGoal] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    if (me.data) {
      setGoal(me.data.daily_goal.goal_xp);
      setName(me.data.display_name);
    }
  }, [me.data]);
  useEffect(() => setMutedState(isMuted()), []);

  if (me.isError) return <PageShell><ErrorState error={me.error} onRetry={() => me.refetch()} /></PageShell>;
  if (!me.data || goal === null) return <PageShell><Skeleton className="h-96" /></PageShell>;

  const dirty = goal !== me.data.daily_goal.goal_xp || name.trim() !== me.data.display_name;
  const save = () =>
    update.mutate(
      { daily_goal_xp: goal, display_name: name.trim() },
      { onSuccess: () => toast("Settings saved", { tone: "success", icon: "✅" }) },
    );

  return (
    <PageShell>
      <h1 className="text-3xl font-black">Settings</h1>

      <section className="mt-8" aria-labelledby="goal-title">
        <h2 id="goal-title" className="text-lg font-black">Daily goal</h2>
        <div role="radiogroup" aria-labelledby="goal-title" className="mt-3 grid grid-cols-2 gap-3">
          {GOALS.map((g) => (
            <button
              key={g.xp}
              role="radio"
              aria-checked={goal === g.xp}
              onClick={() => setGoal(g.xp)}
              className={clsx(
                "rounded-2xl border-2 border-b-4 p-4 text-left transition active:translate-y-[2px] active:border-b-2",
                goal === g.xp ? "border-ocean-400 bg-ocean-50" : "border-ink-200 hover:bg-ink-50",
              )}
            >
              <p className="font-black">{g.label}</p>
              <p className="text-sm font-bold text-ink-500">{g.xp} XP · {g.hint}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <label htmlFor="display-name" className="text-lg font-black">Display name</label>
        <input
          id="display-name"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          className="mt-3 w-full rounded-2xl border-2 border-ink-200 bg-ink-50 px-4 py-3 font-bold outline-none focus:border-ocean-400 focus:bg-white"
        />
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-black">Preferences</h2>
        <label className="flex items-center justify-between rounded-2xl border-2 border-ink-100 p-4">
          <span className="font-bold">Sound effects</span>
          <input
            type="checkbox"
            className="h-6 w-6 accent-leaf-500"
            checked={!muted}
            onChange={(e) => {
              setMuted(!e.target.checked);
              setMutedState(!e.target.checked);
            }}
          />
        </label>
        <div className="flex items-center justify-between rounded-2xl border-2 border-ink-100 p-4">
          <span className="font-bold">Timezone</span>
          <span className="text-sm font-bold text-ink-500">{me.data.timezone} (auto-detected)</span>
        </div>
      </section>

      {update.error && (
        <p role="alert" className="mt-6 font-bold text-coral-600">
          {update.error instanceof ApiError ? update.error.message : "Couldn't save settings."}
        </p>
      )}
      <Button className="mt-8" block disabled={!dirty || !name.trim()} loading={update.isPending} onClick={save}>
        Save changes
      </Button>

      <section className="mt-10 space-y-3" aria-labelledby="more-settings">
        <h2 id="more-settings" className="text-lg font-black">Account</h2>
        <ComingSoon icon="🔐" title="Sign in & password" body="This demo runs as a single default learner." />
        <ComingSoon icon="🔔" title="Notifications" body="Streak reminders and weekly progress emails." />
        <ComingSoon icon="🎙️" title="Speaking exercises" body="Pronunciation practice with speech recognition." />
        <ComingSoon icon="🌍" title="Other courses" body="Only Spanish is seeded in this demo." />
      </section>

      <DemoTools />
    </PageShell>
  );
}
