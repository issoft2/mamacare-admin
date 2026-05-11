/**
 * Client-only chart shell — next/dynamic with ssr: false is only valid in Client Components.
 */

"use client";

import dynamic from "next/dynamic";

const AgentRunsChart = dynamic(
  () => import("@/components/AgentRunsChart").then((m) => m.AgentRunsChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[220px] w-full bg-gray-50 rounded-lg animate-pulse" />
    ),
  }
);

export function DashboardAgentChartClient() {
  return <AgentRunsChart />;
}
