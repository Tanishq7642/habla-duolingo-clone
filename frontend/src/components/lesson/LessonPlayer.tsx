"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Mascot } from "@/components/ui/Mascot";
import { Skeleton } from "@/components/ui/Skeleton";
import { progressRatio } from "@/features/lesson/lessonMachine";
import { useLesson, type LessonSource } from "@/features/lesson/useLesson";

import { ExerciseRenderer } from "./ExerciseRenderer";
import { FeedbackBar } from "./FeedbackBar";
import { LessonHeader } from "./LessonHeader";

// Only needed at the end of a lesson or on failure paths – keep them out of
// the lesson's first load.
const LessonComplete = dynamic(() => import("./LessonComplete").then((m) => m.LessonComplete));
const OutOfHeartsModal = dynamic(() => import("./OutOfHeartsModal").then((m) => m.OutOfHeartsModal));
const QuitDialog = dynamic(() => import("./QuitDialog").then((m) => m.QuitDialog));

/**
 * Full-screen lesson. Purely presentational over `useLesson`: it renders the
 * current phase and forwards learner intents (check, continue, quit) as events.
 */
export function LessonPlayer({ source }: { source: LessonSource }) {
  const router = useRouter();
  const lesson = useLesson(source);
  const { state, exercise, ready } = lesson;
  const [confirmQuit, setConfirmQuit] = useState(false);

  // Enter = Check / Continue, like the real thing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat || confirmQuit) return;
      if (state.phase === "answering" && ready) {
        // preventDefault also stops a focused option button from re-activating.
        e.preventDefault();
        void lesson.submit();
      } else if (state.phase === "feedback" && (e.target as HTMLElement).tagName !== "BUTTON") {
        // (a focused Continue button handles Enter natively)
        e.preventDefault();
        lesson.next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.phase, ready, lesson, confirmQuit]);

  const goHome = () => router.push("/");
  const quit = async () => {
    setConfirmQuit(false);
    await lesson.quit();
    goHome();
  };
  const requestQuit = () => (state.progress.completed > 0 && state.phase !== "failed" ? setConfirmQuit(true) : quit());

  if (state.phase === "loading") return <LessonSkeleton />;

  if (state.phase === "error") {
    return (
      <div className="flex min-h-[100dvh] items-center">
        <ErrorState error={state.error} onRetry={lesson.reload} />
      </div>
    );
  }

  if (state.phase === "completed" && state.completion) {
    return <LessonComplete completion={state.completion} onContinue={goHome} />;
  }

  if (state.phase === "failed") {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
        <Mascot mood="sad" size={130} />
        <h1 className="text-2xl font-black text-ink-900">Session ended</h1>
        <p className="text-ink-500">No worries – every attempt still counts as practice. Come back when you're ready.</p>
        <Button onClick={goHome}>Back to path</Button>
      </div>
    );
  }

  const isPractice = state.session?.kind === "practice";
  const locked = state.phase !== "answering";

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <LessonHeader
        progress={progressRatio(state)}
        hearts={isPractice ? null : state.hearts}
        combo={state.combo}
        onExit={requestQuit}
      />
      {state.session && (
        <p className="mx-auto mt-3 w-full max-w-4xl px-6 text-sm font-bold text-ink-400 sm:pl-[4.5rem]">
          {state.session.subtitle}
          {state.session.resumed && state.progress.completed > 0 && " · Resumed where you left off"}
        </p>
      )}

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-8 sm:py-10">
        {exercise ? (
          <div key={state.turn} className="animate-fade-in">
            <ExerciseRenderer
              exercise={exercise}
              draft={state.draft}
              onChange={lesson.setDraft}
              locked={locked}
              result={state.phase === "feedback" ? state.result : null}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <Mascot mood="cheer" size={120} float />
            <p className="font-extrabold text-ink-500">Wrapping up…</p>
          </div>
        )}
      </main>

      {(state.phase === "answering" || state.phase === "checking" || state.phase === "feedback" || state.phase === "completing") && (
        <div className="sticky bottom-0">
          <FeedbackBar
            phase={state.phase}
            ready={ready}
            result={state.result}
            error={state.error}
            combo={state.combo}
            turn={state.turn}
            onCheck={lesson.submit}
            onContinue={lesson.next}
            onRetryComplete={lesson.retryComplete}
          />
        </div>
      )}

      <OutOfHeartsModal
        open={state.phase === "out_of_hearts"}
        onRefilled={lesson.heartsRefilled}
        onPractice={() => router.push("/practice")}
        onQuit={quit}
      />
      <QuitDialog open={confirmQuit} onStay={() => setConfirmQuit(false)} onQuit={quit} />
    </div>
  );
}

function LessonSkeleton() {
  return (
    <div className="flex min-h-[100dvh] flex-col" aria-busy="true" aria-label="Loading lesson">
      <div className="mx-auto flex w-full max-w-4xl items-center gap-4 px-6 pt-7">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-4 flex-1 rounded-full" />
        <Skeleton className="h-8 w-12" />
      </div>
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-5 pt-20">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-3/4" />
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    </div>
  );
}
