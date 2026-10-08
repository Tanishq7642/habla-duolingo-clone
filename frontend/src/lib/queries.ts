"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { api } from "./api";
import type { Learner } from "./types";

/** Single source of truth for cache keys. */
export const qk = {
  me: ["me"] as const,
  path: ["path"] as const,
  stats: ["me", "stats"] as const,
  activity: ["me", "activity"] as const,
  practice: ["practice", "summary"] as const,
  leaderboard: (period: "week" | "all") => ["leaderboard", period] as const,
  review: (attemptId: number) => ["review", attemptId] as const,
};

export const useLearner = () => useQuery({ queryKey: qk.me, queryFn: api.me });
export const usePath = () => useQuery({ queryKey: qk.path, queryFn: api.path });
export const useStats = () => useQuery({ queryKey: qk.stats, queryFn: api.stats });
export const useActivity = () => useQuery({ queryKey: qk.activity, queryFn: api.activity });
export const usePracticeSummary = () => useQuery({ queryKey: qk.practice, queryFn: api.practiceSummary });
export const useLeaderboard = (period: "week" | "all") =>
  useQuery({ queryKey: qk.leaderboard(period), queryFn: () => api.leaderboard(period) });
export const useReview = (attemptId: number | null) =>
  useQuery({
    queryKey: qk.review(attemptId ?? 0),
    queryFn: () => api.review(attemptId!),
    enabled: attemptId !== null,
  });

/** Patch the cached learner in place (e.g. hearts after an answer) instead of refetching. */
export function patchLearner(client: QueryClient, patch: Partial<Learner>) {
  client.setQueryData<Learner>(qk.me, (prev) => (prev ? { ...prev, ...patch } : prev));
}

/** After a session completes, several derived views change at once. */
export function invalidateAfterCompletion(client: QueryClient) {
  return Promise.all(
    [qk.me, qk.path, qk.stats, qk.activity, qk.practice, ["leaderboard"]].map((queryKey) =>
      client.invalidateQueries({ queryKey }),
    ),
  );
}

export function useRefillHearts() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.refillHearts,
    onSuccess: ({ hearts, gems }) => patchLearner(client, { hearts, gems }),
  });
}

export function useUpdateSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.updateSettings,
    onSuccess: (learner) => {
      client.setQueryData(qk.me, learner);
      client.invalidateQueries({ queryKey: qk.stats });
      client.invalidateQueries({ queryKey: qk.activity });
    },
  });
}
