"use client";

import { useEffect, useRef } from "react";

import { useLearner, useUpdateSettings } from "@/lib/queries";

/**
 * Streaks and daily goals roll over at the learner's local midnight, so the
 * server needs their IANA timezone. Detect it once from the browser.
 */
export function TimezoneSync() {
  const { data: me } = useLearner();
  const update = useUpdateSettings();
  const done = useRef(false);

  useEffect(() => {
    if (!me || done.current) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz !== me.timezone) {
      done.current = true;
      update.mutate({ timezone: tz });
    }
  }, [me, update]);

  return null;
}
