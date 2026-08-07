/**
 * admin/src/app/dashboard/pathway-review/page.tsx
 *
 * Pathway Review & Sign-off — step 3 of the Medical Experts dashboard.
 * Lists every clinical_rules pathway file with its computed review_state
 * (see services/symptom_service/handlers/pathway_review_handler.py for
 * what each state means and the "review + record, engineer deploys"
 * model: a clinician's decision here is recorded, never edits the YAML
 * file directly — an engineer flips its status field in a normal PR).
 */

"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import {
  ApiRequestError,
  fetchPathways,
  type PathwayListItem,
  type ReviewState,
} from "@/lib/pathwayReviewApi";

const STATE_STYLES: Record<ReviewState, { label: string; className: string }> = {
  awaiting_review: {
    label: "Awaiting review",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  stale_review: {
    label: "Needs re-review — file changed",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  changes_requested: {
    label: "Changes requested",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  approved_pending_deploy: {
    label: "Approved — pending deploy",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  deployed: {
    label: "Deployed",
    className: "bg-green-100 text-green-800 border-green-200",
  },
};

function StateBadge({ state }: { state: ReviewState }) {
  const style = STATE_STYLES[state];
  return (
    <span className={`px-2.5 py-1 rounded-full border text-xs font-medium ${style.className}`}>
      {style.label}
    </span>
  );
}

function PathwayRow({ item }: { item: PathwayListItem }) {
  return (
    <Link
      href={`/dashboard/pathway-review/${item.pathway_id}`}
      className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:border-navy-200 transition-colors"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-navy-700">{item.pathway_name}</h3>
          <p className="text-xs text-gray-400 mt-1 font-mono">{item.file_path}</p>
        </div>
        <StateBadge state={item.review_state} />
      </div>

      <div className="mt-4 flex items-center gap-4 flex-wrap text-xs text-gray-500">
        <span>{item.rules_count} {item.rules_count === 1 ? "rule" : "rules"}</span>
        <span>File status: <span className="font-medium text-gray-700">{item.file_status}</span></span>
        {item.latest_review && (
          <span>
            Last decision: <span className="font-medium text-gray-700">{item.latest_review.decision}</span>
            {" "}by {item.latest_review.reviewer_clerk_id}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function PathwayReviewPage() {
  const { getToken } = useAuth();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["clinical-pathways"],
    queryFn: async () => fetchPathways(await getToken()),
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-700">Pathway Review</h1>
        <p className="text-gray-500 mt-1">
          Clinical sign-off on the deterministic rules engine. Only pathways
          with file status <span className="font-mono">approved</span> are
          ever evaluated for real — see each pathway for details.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-28 animate-pulse"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Could not load pathways</p>
          <p className="mt-1 text-amber-800">
            {error instanceof ApiRequestError && error.status === 403
              ? "Forbidden: this account isn't on CLINICAL_REVIEWER_CLERK_USER_IDS. Ask whoever manages backend config to add your Clerk user id, or run the API with APP_ENV=development for local review."
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
      )}

      {data && (
        <div className="grid grid-cols-1 gap-4">
          {data.items.map((item) => (
            <PathwayRow key={item.pathway_id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
