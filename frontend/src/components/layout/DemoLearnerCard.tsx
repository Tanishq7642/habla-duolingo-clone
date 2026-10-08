"use client";

import { Avatar } from "@/components/ui/Avatar";
import { useLearner } from "@/lib/queries";

/**
 * The brief allows a single default logged-in learner, so the app has no sign-in.
 * Make that explicit instead of leaving visitors wondering who "Alex" is.
 */
export function DemoLearnerCard() {
  const { data: me } = useLearner();
  if (!me) return null;
  return (
    <div className="mt-auto rounded-2xl border-2 border-ink-100 p-3" title="Authentication is simplified: everyone uses the seeded demo learner.">
      <div className="flex items-center gap-3">
        <Avatar name={me.display_name} color={me.avatar_color} size={36} />
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-ink-900">{me.display_name}</p>
          <p className="text-xs font-bold text-ink-500">Demo learner</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-500">
        No sign-in needed. Everyone uses this shared demo account. Settings → <span className="font-bold">Reset demo</span> restores it.
      </p>
    </div>
  );
}
