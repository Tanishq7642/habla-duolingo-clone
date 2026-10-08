/**
 * Integration test: the real LessonPlayer (state machine + exercise renderers +
 * feedback bar + completion screen) against a fake backend served via fetch.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense, lazy, type ComponentType } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/components/ui/Toast";
import type { AnswerResult, Completion, Learner, Session } from "@/lib/types";

import { LessonPlayer } from "./LessonPlayer";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
// next/dynamic → React.lazy so lazily-loaded modals/screens work under jsdom.
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<ComponentType<object>>) => {
    const Lazy = lazy(async () => ({ default: await loader() }));
    return (props: object) => (
      <Suspense fallback={null}>
        <Lazy {...props} />
      </Suspense>
    );
  },
}));

// ---------------------------------------------------------------- fake backend
const session: Session = {
  attempt_id: 7,
  kind: "lesson",
  status: "in_progress",
  lesson_id: 1,
  title: "Fruit",
  subtitle: "🍎 Food · Lesson 1",
  exercises: [
    { id: 101, type: "multiple_choice", prompt: "Which one is “the apple”?", xp: 5,
      data: { options: [{ id: "a", text: "la casa" }, { id: "b", text: "la manzana" }] } },
    { id: 102, type: "type_answer", prompt: "Write this in Spanish", xp: 7,
      data: { source_text: "hello", placeholder: "Type in Spanish", answer_language: "es" } },
  ],
  next_exercise_id: 101,
  progress: { completed: 0, total: 2 },
  mistakes: 0,
  hearts: 5,
  resumed: false,
};

const answer = (over: Partial<AnswerResult>): AnswerResult => ({
  correct: true, correct_answer: "", note: null, explanation: "", detail: null, xp_earned: 5,
  hearts_remaining: 5, out_of_hearts: false, requeued: false, progress: { completed: 1, total: 2 },
  next_exercise_id: 102, ...over,
});

const completion = {
  attempt_id: 7, kind: "lesson", already_completed: false, xp: { base: 12, bonus: 5, total: 17 },
  gems_awarded: 5, hearts_awarded: 0, hearts: 4, mistakes: 1, perfect: false, accuracy: 67, duration_seconds: 75,
  streak: { current: 5, longest: 5, extended: true },
  daily_goal: { goal_xp: 20, xp_today: 17, reached: false, just_reached: false },
  level: { level: 3, xp_into_level: 40, xp_for_next_level: 150, leveled_up: false },
  skill: null, unlocked_skill: { id: 3, title: "Animals", icon: "🐶" }, achievements: [],
} as Completion;

type Handler = (body: Record<string, unknown> | undefined) => { status?: number; json?: unknown } | "network-error";
let routes: Record<string, Handler>;
let calls: { path: string; body?: Record<string, unknown> }[];

function installFetch() {
  calls = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const path = url.replace(/^\/api/, "");
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ path, body });
    const handler = routes[`${init?.method ?? "GET"} ${path}`];
    if (!handler) throw new Error(`Unexpected request ${init?.method} ${path}`);
    const res = handler(body);
    if (res === "network-error") throw new TypeError("Failed to fetch");
    return new Response(JSON.stringify(res.json ?? {}), { status: res.status ?? 200 });
  }));
}

function renderLesson() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <LessonPlayer source={{ kind: "lesson", lessonId: 1 }} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  push.mockReset();
  routes = {
    "POST /lessons/1/start": () => ({ json: session }),
    "GET /me": () => ({ json: { hearts: 0, gems: 500, heart_refill_cost: 350 } as Partial<Learner> }),
    "POST /attempts/7/complete": () => ({ json: completion }),
  };
  installFetch();
  // Learner prefers reduced motion: counters jump straight to their value
  // (also exercises that accessibility path).
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("reduce"), media: query }));
});
afterEach(() => vi.unstubAllGlobals());

describe("LessonPlayer", () => {
  it("runs the whole loop: wrong answer → feedback → next → correct → completion", async () => {
    const user = userEvent.setup();
    routes["POST /attempts/7/answers"] = (body) =>
      body!.exercise_id === 101
        ? { json: answer({ correct: false, correct_answer: "la manzana", explanation: "Manzana = apple.", xp_earned: 0,
            hearts_remaining: 4, requeued: true, progress: { completed: 0, total: 2 }, next_exercise_id: 102 }) }
        : { json: answer({ xp_earned: 7, hearts_remaining: 4, progress: { completed: 2, total: 2 }, next_exercise_id: null }) };
    renderLesson();

    expect(await screen.findByText("Which one is “the apple”?")).toBeInTheDocument();
    const check = screen.getByRole("button", { name: "Check" });
    expect(check).toBeDisabled(); // nothing selected yet

    await user.click(screen.getByRole("radio", { name: /la casa/ }));
    await user.click(check);
    expect(await screen.findByText("Not quite")).toBeInTheDocument();
    expect(screen.getByText(/Correct answer:/)).toHaveTextContent("Correct answer: la manzana");
    expect(screen.getByText("Manzana = apple.")).toBeInTheDocument();
    expect(screen.getByLabelText("4 hearts left")).toBeInTheDocument();
    expect(calls.find((c) => c.path === "/attempts/7/answers")?.body).toEqual({ exercise_id: 101, answer: { option_id: "a" } });

    await user.click(screen.getByRole("button", { name: "Continue" }));
    const input = await screen.findByLabelText("Your answer");
    await user.type(input, "hola{Enter}"); // Enter = Check
    await screen.findByText("+7 XP");

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Lesson complete!")).toBeInTheDocument();
    expect(await screen.findByText("17")).toBeInTheDocument(); // animated XP total settles
    expect(screen.getByText(/New skill unlocked/)).toHaveTextContent("Animals");
    expect(screen.getByText("67%")).toBeInTheDocument(); // accuracy tile ("Good")
    expect(screen.getByText("Good")).toBeInTheDocument();
    expect(screen.getByText("1:15")).toBeInTheDocument(); // time tile ("Speedy")
    expect(calls.filter((c) => c.path === "/attempts/7/complete")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(push).toHaveBeenCalledWith("/");
  });

  it("keeps the learner's answer when the network fails, and the retry succeeds", async () => {
    const user = userEvent.setup();
    let attempts = 0;
    routes["POST /attempts/7/answers"] = () => (++attempts === 1 ? "network-error" : { json: answer({}) });
    renderLesson();

    await user.click(await screen.findByRole("radio", { name: /la manzana/ }));
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Connection lost.*answer is kept/);
    expect(screen.getByRole("radio", { name: /la manzana/ })).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(await screen.findByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(screen.queryByText(/Connection lost/)).not.toBeInTheDocument();
    expect(attempts).toBe(2);
  });

  it("Skip works with no answer selected and shows the correct answer", async () => {
    const user = userEvent.setup();
    routes["POST /attempts/7/skip"] = (body) => {
      expect(body).toEqual({ exercise_id: 101 });
      return { json: answer({ correct: false, correct_answer: "la manzana", xp_earned: 0, hearts_remaining: 4, requeued: true }) };
    };
    renderLesson();
    await screen.findByText("Which one is “the apple”?");
    expect(screen.getByRole("button", { name: "Check" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(await screen.findByText("Not quite")).toBeInTheDocument();
    expect(screen.getByText(/Correct answer:/)).toHaveTextContent("la manzana");
  });

  it("shows the out-of-hearts modal when the last heart is lost", async () => {
    const user = userEvent.setup();
    routes["POST /attempts/7/answers"] = () =>
      ({ json: answer({ correct: false, xp_earned: 0, hearts_remaining: 0, out_of_hearts: true, next_exercise_id: 101 }) });
    renderLesson();

    await user.click(await screen.findByRole("radio", { name: /la casa/ }));
    await user.click(screen.getByRole("button", { name: "Check" }));
    await user.click(await screen.findByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("dialog", { name: "You ran out of hearts" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Practice to earn a heart/ })).toBeInTheDocument();
  });

  it("shows a specific, non-retryable message for a locked lesson", async () => {
    routes["POST /lessons/1/start"] = () => ({
      status: 403, json: { error: { code: "lesson_locked", message: "Finish the previous lessons to unlock this one." } },
    });
    renderLesson();
    expect(await screen.findByText("Lesson locked 🔒")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });
});
