import type {
  Activity,
  AnswerResult,
  Completion,
  Leaderboard,
  LearningPath,
  Learner,
  PracticeSummary,
  Review,
  Session,
  SkillNode,
  Stats,
} from "./types";

/** Error carrying the backend's stable `code` so the UI can choose a recovery path. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** No response at all: server down, offline, DNS… */
  get isNetwork() {
    return this.status === 0;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "network_error", "We can't reach the Habla servers. Check your connection.");
  }
  if (res.status === 204) return undefined as T;
  if (res.ok) return (await res.json()) as T;

  let code = "http_error";
  let message = `Request failed (${res.status}).`;
  try {
    const body = await res.json();
    code = body?.error?.code ?? code;
    message = body?.error?.message ?? message;
  } catch {
    // Non-JSON error page (e.g. proxy 502 while the API is down).
    if (res.status >= 500) {
      code = "server_unavailable";
      message = "The Habla server isn't responding right now.";
    }
  }
  throw new ApiError(res.status, code, message);
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  me: () => request<Learner>("/me"),
  stats: () => request<Stats>("/me/stats"),
  activity: () => request<Activity>("/me/activity"),
  updateSettings: (body: Partial<Pick<Learner, "timezone" | "display_name">> & { daily_goal_xp?: number }) =>
    request<Learner>("/me/settings", { method: "PATCH", body: JSON.stringify(body) }),
  refillHearts: () => post<{ hearts: number; max_hearts: number; gems: number }>("/me/hearts/refill"),

  path: () => request<LearningPath>("/path"),
  skill: (id: number) => request<SkillNode>(`/skills/${id}`),

  startLesson: (lessonId: number) => post<Session>(`/lessons/${lessonId}/start`),
  session: (attemptId: number) => request<Session>(`/attempts/${attemptId}`),
  answer: (attemptId: number, exerciseId: number, answer: unknown) =>
    post<AnswerResult>(`/attempts/${attemptId}/answers`, { exercise_id: exerciseId, answer }),
  complete: (attemptId: number) => post<Completion>(`/attempts/${attemptId}/complete`),
  abandon: (attemptId: number) => post<Session>(`/attempts/${attemptId}/abandon`),
  review: (attemptId: number) => request<Review>(`/attempts/${attemptId}/review`),

  practiceSummary: () => request<PracticeSummary>("/practice/summary"),
  startPractice: () => post<Session>("/practice/start"),

  leaderboard: (period: "week" | "all") => request<Leaderboard>(`/leaderboard?period=${period}`),

  // Demo tools (simulate days passing / reset the seeded learner)
  timeTravel: (days: number) => post<Learner>("/dev/time-travel", { days }),
  // Sends the browser's timezone so the reseeded history ("practised yesterday") matches the viewer's calendar.
  resetDemo: () => post<void>("/dev/reset", { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
};
