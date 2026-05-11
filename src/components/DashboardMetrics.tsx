/**
 * Fetches live platform stats from GET /data/stats/dashboard.
 */

"use client";

import { ApiRequestError, useDashboardStats } from "@mamacare/api";
import { MetricCard } from "@/components/MetricCard";

function fmt(n: number): string {
  return new Intl.NumberFormat("en-GB").format(n);
}

export function DashboardMetrics() {
  const { data, isLoading, isError, error, refetch } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-28 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    const is403 = error instanceof ApiRequestError && error.status === 403;
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">Could not load dashboard stats</p>
        <p className="mt-1 text-amber-800">
          {is403
            ? "Forbidden: in production set ADMIN_STATS_ALLOWED_CLERK_USER_IDS to your Clerk user id, or run the API with APP_ENV=development for local admin."
            : (error as Error).message}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 text-rose-600 font-medium hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Active users"
        value={fmt(data.active_users_30d)}
        description="Distinct users with activity (30 days)"
      />
      <MetricCard
        title="Symptom logs"
        value={fmt(data.symptom_logs_7d)}
        description="New logs (7 days)"
      />
      <MetricCard
        title="Agent runs"
        value={fmt(data.agent_runs_7d)}
        description="Pipeline runs (7 days)"
      />
      <MetricCard
        title="AI cost"
        value={fmt(data.ai_tokens_month)}
        description="Total tokens (prompt + completion, this month)"
      />
    </div>
  );
}
