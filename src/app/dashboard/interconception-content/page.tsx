/**
 * admin/src/app/dashboard/interconception-content/page.tsx
 *
 * Interconception content review — the queue for guidance shown in
 * `ongoing_care`, the state a mother reaches once the postpartum period
 * ends.
 *
 * That state has been reachable and empty since the phase engine shipped.
 * Nothing appears there until a piece here is approved, and approval is of
 * exact words: editing an approved piece withdraws it immediately. That is
 * why the badge below reads from is_servable and edited_since_approval
 * rather than from status — a row can say "approved" and correctly not be
 * reaching anyone.
 */

"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import {
  ApiRequestError,
  fetchContentList,
  type ContentItem,
} from "@/lib/interconceptionContentApi";

const CATEGORY_LABELS: Record<string, string> = {
  recovery: "Recovery",
  birth_spacing: "Birth spacing",
  family_planning: "Family planning",
  nutrition: "Nutrition",
  preconception: "Preconception",
  previous_pregnancy_review: "Previous pregnancy review",
};

/**
 * What a reviewer needs to know at a glance, which is not the same as the
 * stored status. "Live" means a mother can see it right now; everything
 * else explains why she cannot.
 */
function statusBadge(item: ContentItem): { label: string; className: string } {
  if (item.edited_since_approval) {
    return {
      label: "Edited since approval — not live",
      className: "bg-amber-100 text-amber-800 border-amber-200",
    };
  }
  if (item.is_servable) {
    return {
      label: "Live",
      className: "bg-green-100 text-green-800 border-green-200",
    };
  }
  if (item.status === "changes_requested") {
    return {
      label: "Changes requested",
      className: "bg-red-100 text-red-800 border-red-200",
    };
  }
  if (item.status === "approved") {
    //  Approved with nothing recorded about what was approved. Rare, and
    //  worth showing rather than rendering as live.
    return {
      label: "Approved — not live",
      className: "bg-amber-100 text-amber-800 border-amber-200",
    };
  }
  return {
    label: "Awaiting review",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  };
}

function ContentRow({ item }: { item: ContentItem }) {
  const badge = statusBadge(item);
  return (
    <Link
      href={`/dashboard/interconception-content/${item.slug}`}
      className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:border-navy-200 transition-colors"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-navy-700">{item.title}</h3>
          <p className="text-xs text-gray-400 mt-1 font-mono">{item.slug}</p>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full border text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-4 flex-wrap text-xs text-gray-500">
        <span>{CATEGORY_LABELS[item.category] ?? item.category}</span>
        <span>
          {item.weeks_from == null
            ? "Any time"
            : `From week ${item.weeks_from} of interconception`}
        </span>
        {item.reviewed_by && (
          <span>
            Last reviewed by{" "}
            <span className="font-medium text-gray-700">{item.reviewed_by}</span>
          </span>
        )}
      </div>
    </Link>
  );
}

export default function InterconceptionContentPage() {
  const { getToken } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["interconception-content"],
    queryFn: async () => fetchContentList(await getToken()),
  });

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold text-navy-800">
        Interconception content
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Guidance shown to a mother once her postpartum period ends. Nothing
        here reaches her until you approve it, and editing a piece you have
        already approved takes it back down until you approve it again.
      </p>

      {isLoading && <p className="mt-8 text-sm text-gray-500">Loading…</p>}

      {error && (
        <p className="mt-8 text-sm text-red-700">
          {error instanceof ApiRequestError
            ? error.message
            : "Could not load the content queue."}
        </p>
      )}

      {data && data.length === 0 && (
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-sm text-gray-700">
            Nothing has been written yet, so mothers in interconception are
            being shown nothing.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            That is the intended behaviour rather than a fault — an empty
            screen is a gap, unreviewed guidance would be a harm.
          </p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="mt-8 space-y-4">
          {data.map((item) => (
            <ContentRow key={item.slug} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
