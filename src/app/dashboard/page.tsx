/**
 * admin/src/app/dashboard/page.tsx
 * Overview dashboard — key metrics.
 *
 * Chart is loaded via a Client Component (DashboardAgentChartClient) so
 * next/dynamic(..., { ssr: false }) is valid (not allowed in Server Components).
 */

import { DashboardAgentChartClient } from "@/components/DashboardAgentChartClient";
import { DashboardMetrics } from "@/components/DashboardMetrics";

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-700">Dashboard</h1>
        <p className="text-gray-500 mt-1">Safeborn platform overview</p>
        <p className="text-sm text-gray-400 mt-2 max-w-2xl">
          Top cards load from{" "}
          <code className="text-gray-500">/data/stats/dashboard</code>; the chart below uses{" "}
          <code className="text-gray-500">/data/stats/agent-activity</code> (last 7 days, UTC).
        </p>
      </div>

      <DashboardMetrics />

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          Agent pipeline activity
        </h2>
        <p className="text-xs text-gray-500 mb-4 max-w-2xl">
          <span className="font-medium text-gray-600">Total runs</span> = all agent pipeline
          runs that day. <span className="font-medium text-gray-600">Escalated (urgent)</span> = runs
          whose urgency tier is notify midwife, notify doctor, or emergency advised.
        </p>
        <DashboardAgentChartClient />
      </div>
    </div>
  );
}
