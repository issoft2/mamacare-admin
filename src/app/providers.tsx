"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// configureApiClient(() => getToken()) used to be wired here, from the
// missing @safeborn/api package — see README.md. Removed rather than left
// broken, since this file wraps every route (including ones that don't
// depend on that package at all, like Clinical Review), so a dead import
// here blocked the entire app's build, not just the pages that actually
// need it. Pages built without @safeborn/api (src/lib/reviewApi.ts) get
// their Clerk token directly via useAuth() where needed instead of a
// shared, app-wide configuration step.

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 2,
            // Default 'online' mode treats a fetch-level network error as
            // "browser is offline" and pauses the query indefinitely
            // instead of erroring — leaves loading/error UI stuck forever
            // whenever the API is actually just unreachable (bad host,
            // CORS, DNS), not the browser's connectivity.
            networkMode: "always",
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
