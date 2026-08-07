/**
 * Bar chart: daily agent run counts and urgency escalations from
 * GET /data/stats/agent-activity.
 */

"use client";

import { ApiRequestError, useAgentActivity } from "@/lib/statsApi";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const dayLabelFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short" });

function utcNoonForLabel(raw: string): Date {
  const s = String(raw).trim();
  if (!s) {
    return new Date(NaN);
  }
  if (s.includes("T")) {
    return new Date(s);
  }
  return new Date(`${s}T12:00:00.000Z`);
}

function toChartDayLabel(raw: string): string {
  const s = String(raw).trim();
  const d = utcNoonForLabel(s);
  if (Number.isNaN(d.getTime())) {
    return s.length >= 10 ? s.slice(0, 10) : s || "—";
  }
  return dayLabelFmt.format(d);
}

function toChartPoints(items: { date: string; runs: number; escalated: number }[]) {
  return items.map((p) => ({
    ...p,
    day: toChartDayLabel(p.date),
  }));
}

export function AgentRunsChart() {
  const { data, isLoading, isError, error, refetch } = useAgentActivity({ days: 7 });

  if (isLoading) {
    return (
      <div className="h-[220px] w-full bg-gray-50 rounded-lg animate-pulse" />
    );
  }

  if (isError) {
    const is403 = error instanceof ApiRequestError && error.status === 403;
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <p className="font-medium">Could not load chart data</p>
        <p className="mt-1 text-amber-800">
          {is403
            ? "Admin stats are restricted (same as dashboard cards — check APP_ENV or allowlist)."
            : (error as Error).message}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-2 text-rose-600 font-medium hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data?.items?.length) {
    return (
      <p className="text-sm text-gray-500 py-6 text-center">No data for the selected range.</p>
    );
  }

  const chartData = toChartPoints(data.items);

  return (
    <div className="h-[220px] w-full min-w-0" aria-label="Agent pipeline activity, last 7 days UTC">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }} />
          <Bar
            dataKey="runs"
            fill="#1A2E4A"
            radius={[4, 4, 0, 0]}
            name="Total runs"
          />
          <Bar
            dataKey="escalated"
            fill="#C05070"
            radius={[4, 4, 0, 0]}
            name="Escalated (urgent)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
