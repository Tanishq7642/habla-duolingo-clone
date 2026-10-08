"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

import { ToastProvider } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { applyTheme, getThemePreference } from "@/lib/theme";

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Learner data only changes through this client's own actions, which
        // patch or invalidate the cache explicitly – no need to poll.
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: (count, error) => {
          // 4xx are answers, not glitches; retrying won't change them.
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
          return count < 2;
        },
      },
      mutations: { retry: false },
    },
  });
}

/** With the "system" preference, follow OS light/dark changes live. */
function useSystemThemeSync() {
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;
    const onChange = () => getThemePreference() === "system" && applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(makeClient);
  useSystemThemeSync();
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
