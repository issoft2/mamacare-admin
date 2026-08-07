/**
 * admin/src/lib/statsApi.ts
 *
 * Self-contained replacement for the two hooks DashboardMetrics.tsx and
 * AgentRunsChart.tsx used to import from the missing @safeborn/api package
 * (see README.md). Same pattern as src/lib/reviewApi.ts — plain fetch,
 * Clerk token via useAuth(), no workspace dependency. Types match
 * services/data_service/schemas/stats_schemas.py exactly (DashboardStatsResponse,
 * AgentActivityResponse) rather than guessing.
 */

"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.mummycare.org";

export class ApiRequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export interface DashboardStatsResponse {
  registered_users: number;
  symptom_logs_7d: number;
  agent_runs_7d: number;
  active_users_30d: number;
  ai_tokens_month: number;
}

export interface AgentActivityDay {
  date: string;
  runs: number;
  escalated: number;
}

export interface AgentActivityResponse {
  items: AgentActivityDay[];
}

async function authedFetch<T>(path: string, token: string | null): Promise<T> {
  if (!token) {
    throw new ApiRequestError(401, "Not signed in.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body?.detail?.error?.message ?? message;
    } catch {
      // response body wasn't JSON — keep the generic message
    }
    throw new ApiRequestError(response.status, message);
  }

  return response.json() as Promise<T>;
}

export function useDashboardStats(): UseQueryResult<DashboardStatsResponse> {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["stats", "dashboard"],
    queryFn: async () => authedFetch<DashboardStatsResponse>("/data/stats/dashboard", await getToken()),
  });
}

export function useAgentActivity(params: { days?: number } = {}): UseQueryResult<AgentActivityResponse> {
  const { getToken } = useAuth();
  const days = params.days ?? 7;
  return useQuery({
    queryKey: ["stats", "agent-activity", days],
    queryFn: async () =>
      authedFetch<AgentActivityResponse>(`/data/stats/agent-activity?days=${days}`, await getToken()),
  });
}
