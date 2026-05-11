"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { configureApiClient } from "@mamacare/api";

function ApiConfigurer({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  // Set during render (not useLayoutEffect) so the getter exists before child components
  // run useQuery — layout effects on children can otherwise fire first-visit fetches
  // with the default no-op token and break admin /data/* requests.
  configureApiClient(() => getToken());
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 1000 * 60 * 5, retry: 2 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ApiConfigurer>{children}</ApiConfigurer>
    </QueryClientProvider>
  );
}
