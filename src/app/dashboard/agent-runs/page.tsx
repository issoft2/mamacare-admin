/**
 * admin/src/app/dashboard/agent-runs/page.tsx
 * Agent pipeline run monitoring.
 */

export default function AgentRunsPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-700">Agent Runs</h1>
        <p className="text-gray-500 mt-1">Pipeline execution monitoring</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-400 text-center py-12">
          Connect to the API to load agent run data
        </p>
      </div>
    </div>
  );
}
