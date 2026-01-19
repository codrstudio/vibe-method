"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 min - dados frescos
            gcTime: 10 * 60 * 1000, // 10 min - garbage collection
            refetchOnWindowFocus: true, // Revalida ao focar aba
            refetchOnReconnect: true, // Revalida ao reconectar
            retry: (count, error: unknown) => {
              const err = error as { status?: number };
              if (err?.status && err.status >= 400 && err.status < 500)
                return false;
              return count < 3;
            },
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools em dev - botão oculto via CSS, use Ctrl+Shift+D para abrir */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
      {process.env.NODE_ENV === "development" && (
        <style>{`.tsqd-open-btn-container { display: none !important; }`}</style>
      )}
    </QueryClientProvider>
  );
}
