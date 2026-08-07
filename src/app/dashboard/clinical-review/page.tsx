/**
 * admin/src/app/dashboard/clinical-review/page.tsx
 *
 * The unmapped-statements review queue — mothers' own words that were
 * clinically relevant but didn't map to any known symptom code (see
 * services/chat_service/symptom_extraction and the review-queue backend
 * built specifically so nothing like this sits unread. Gated by the
 * backend's require_clinical_reviewer(), a separate allow-list from
 * general admin access — see shared/auth/clinical_reviewer_gate.py.
 */

"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiRequestError,
  fetchUnmappedReview,
  markUnmappedReviewed,
  type UnmappedStatementReviewItem,
} from "@/lib/reviewApi";

const URGENCY_STYLES: Record<string, string> = {
  EMERGENCY: "bg-red-100 text-red-800 border-red-200",
  URGENT: "bg-orange-100 text-orange-800 border-orange-200",
  MODERATE: "bg-amber-100 text-amber-800 border-amber-200",
  WATCHFUL: "bg-yellow-100 text-yellow-800 border-yellow-200",
  NORMAL: "bg-gray-100 text-gray-700 border-gray-200",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ReviewItemCard({
  item,
  onMarkReviewed,
  isMarking,
}: {
  item: UnmappedStatementReviewItem;
  onMarkReviewed: (id: string) => void;
  isMarking: boolean;
}) {
  const urgencyStyle = item.urgency_tier
    ? URGENCY_STYLES[item.urgency_tier] ?? URGENCY_STYLES.NORMAL
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap text-xs font-medium">
          <span className="px-2.5 py-1 rounded-full bg-navy-50 text-navy-700 border border-navy-100">
            Week {item.gestational_week} · {item.phase}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 capitalize">
            {item.source}
          </span>
          {urgencyStyle && (
            <span className={`px-2.5 py-1 rounded-full border ${urgencyStyle}`}>
              {item.urgency_tier}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {formatDateTime(item.created_at)}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {item.unmapped_statements.map((statement, idx) => (
          <p
            key={idx}
            className="text-sm text-gray-800 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100 italic"
          >
            &ldquo;{statement}&rdquo;
          </p>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        {item.reviewed_at ? (
          <p className="text-xs text-gray-400">
            Reviewed {formatDateTime(item.reviewed_at)}
            {item.reviewed_by ? ` by ${item.reviewed_by}` : ""}
          </p>
        ) : (
          <span className="text-xs text-gray-400">Not yet reviewed</span>
        )}
        {!item.reviewed_at && (
          <button
            type="button"
            onClick={() => onMarkReviewed(item.id)}
            disabled={isMarking}
            className="text-sm font-medium text-rose-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMarking ? "Marking…" : "Mark reviewed"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ClinicalReviewPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [includeReviewed, setIncludeReviewed] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["unmapped-review", includeReviewed],
    queryFn: async () => fetchUnmappedReview(await getToken(), { limit: 50, includeReviewed }),
  });

  const markReviewed = useMutation({
    mutationFn: async (logId: string) => markUnmappedReviewed(await getToken(), logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unmapped-review"] });
    },
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy-700">Clinical Review</h1>
          <p className="text-gray-500 mt-1">
            What mothers said that didn&rsquo;t map to a known symptom code — captured,
            not discarded, and reviewed here.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={includeReviewed}
            onChange={(e) => setIncludeReviewed(e.target.checked)}
            className="rounded border-gray-300"
          />
          Show already-reviewed
        </label>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-32 animate-pulse"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Could not load the review queue</p>
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

      {data && data.items.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-400">
            {includeReviewed
              ? "Nothing has been captured here yet."
              : "Nothing waiting on review right now."}
          </p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <p className="text-xs text-gray-400 mb-4">
            {data.total} {data.total === 1 ? "item" : "items"}
            {!includeReviewed ? " awaiting review" : ""}
          </p>
          <div className="grid grid-cols-1 gap-4">
            {data.items.map((item) => (
              <ReviewItemCard
                key={item.id}
                item={item}
                onMarkReviewed={(id) => markReviewed.mutate(id)}
                isMarking={markReviewed.isPending && markReviewed.variables === item.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
