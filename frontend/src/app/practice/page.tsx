"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { LessonPlayer } from "@/components/lesson/LessonPlayer";

function PracticeSession() {
  const router = useRouter();
  const params = useSearchParams();
  // Read once: the URL is updated after creation and must not restart the session.
  const [initialAttempt] = useState(() => {
    const n = Number(params.get("attempt"));
    return Number.isInteger(n) && n > 0 ? n : null;
  });

  // A new practice session gets its id written into the URL, so a refresh
  // resumes the same session instead of generating a fresh one.
  return (
    <LessonPlayer
      source={{
        kind: "practice",
        attemptId: initialAttempt,
        onCreated: (id) => router.replace(`/practice?attempt=${id}`, { scroll: false }),
      }}
    />
  );
}

export default function PracticePage() {
  return (
    <Suspense>
      <PracticeSession />
    </Suspense>
  );
}
