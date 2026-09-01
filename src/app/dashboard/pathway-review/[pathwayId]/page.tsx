/**
 * admin/src/app/dashboard/pathway-review/[pathwayId]/page.tsx
 *
 * Full rule detail for one clinical_rules pathway, with the sign-off
 * action itself. Approving here records a decision (PathwayReview) — it
 * does not flip the file's status field. See
 * services/symptom_service/handlers/pathway_review_handler.py for the
 * full model and shared/auth/clinical_reviewer_gate.py for who can act
 * here.
 */

"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiRequestError,
  fetchPathwayDetail,
  submitPathwayReview,
  type PathwayRuleSummary,
  type PathwaySuggestion,
} from "@/lib/pathwayReviewApi";

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

function formatCondition(cond: Record<string, unknown>): string {
  const field = String(cond.field ?? "?");
  const operator = String(cond.operator ?? "?");
  const value = JSON.stringify(cond.value);
  const context = cond.context ? " (context only)" : "";
  return `${field} ${operator} ${value}${context}`;
}

function ConditionsBlock({ conditions }: { conditions: Record<string, unknown> }) {
  const mode = "all" in conditions ? "all" : "any";
  const list = (conditions[mode] as Record<string, unknown>[] | undefined) ?? [];
  return (
    <div className="text-sm">
      <span className="font-medium text-gray-600">
        {mode === "all" ? "ALL of:" : "ANY of:"}
      </span>
      <ul className="mt-1 space-y-1">
        {list.map((cond, idx) => (
          <li key={idx} className="font-mono text-xs bg-gray-50 border border-gray-100 rounded px-2 py-1 inline-block mr-2 mb-1">
            {formatCondition(cond)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SuggestionForm({
  onAdd,
  onCancel,
}: {
  onAdd: (s: Omit<PathwaySuggestion, "rule_id">) => void;
  onCancel: () => void;
}) {
  const [field, setField] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [suggestedValue, setSuggestedValue] = useState("");
  const [rationale, setRationale] = useState("");

  return (
    <div className="mt-4 border border-gray-200 rounded-lg p-3 space-y-2 bg-white">
      <input
        value={field}
        onChange={(e) => setField(e.target.value)}
        placeholder="What to change (e.g. gestational_week threshold, urgency, reason wording)"
        className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          placeholder="Current value (optional)"
          className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
        />
        <input
          value={suggestedValue}
          onChange={(e) => setSuggestedValue(e.target.value)}
          placeholder="Suggested value"
          className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
        />
      </div>
      <textarea
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
        placeholder="Why (optional)"
        rows={2}
        className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!field.trim() || !suggestedValue.trim()}
          onClick={() => {
            onAdd({
              field: field.trim(),
              current_value: currentValue.trim() || null,
              suggested_value: suggestedValue.trim(),
              rationale: rationale.trim() || null,
            });
          }}
          className="px-3 py-1.5 rounded-lg bg-navy-700 text-white text-xs font-medium hover:bg-navy-800 disabled:opacity-50"
        >
          Add suggestion
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function RuleCard({
  rule,
  onAddSuggestion,
}: {
  rule: PathwayRuleSummary;
  onAddSuggestion: (s: PathwaySuggestion) => void;
}) {
  const [suggesting, setSuggesting] = useState(false);
  const urgencyStyle = URGENCY_STYLES[rule.urgency] ?? URGENCY_STYLES.NORMAL;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <span className={`px-2.5 py-1 rounded-full border text-xs font-medium ${urgencyStyle}`}>
          {rule.urgency}
        </span>
        {rule.bypasses_trend_scoring && (
          <span className="px-2.5 py-1 rounded-full border border-navy-200 bg-navy-50 text-navy-700 text-xs font-medium">
            Final — no override
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-gray-800">{rule.description.trim()}</p>

      <div className="mt-4">
        <ConditionsBlock conditions={rule.conditions} />
      </div>

      {rule.on_missing_field && (
        <p className="mt-3 text-xs text-gray-500">
          If a field above can&rsquo;t be determined:{" "}
          <span className="font-medium text-gray-700">{rule.on_missing_field}</span>
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Shown to the mother — reason</p>
          <p className="text-sm text-gray-800">{rule.reason}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Shown to the mother — recommendation</p>
          <p className="text-sm text-gray-800">{rule.recommendation}</p>
        </div>
      </div>

      {suggesting ? (
        <SuggestionForm
          onAdd={(s) => {
            onAddSuggestion({ ...s, rule_id: rule.id });
            setSuggesting(false);
          }}
          onCancel={() => setSuggesting(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setSuggesting(true)}
          className="mt-4 text-xs font-medium text-rose-600 hover:underline"
        >
          Suggest a specific change to this rule
        </button>
      )}
    </div>
  );
}

export default function PathwayDetailPage({
  params,
}: {
  params: Promise<{ pathwayId: string }>;
}) {
  const { pathwayId } = use(params);
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [suggestions, setSuggestions] = useState<PathwaySuggestion[]>([]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["clinical-pathways", pathwayId],
    queryFn: async () => fetchPathwayDetail(await getToken(), pathwayId),
  });

  const review = useMutation({
    mutationFn: async (decision: "approved" | "changes_requested") =>
      submitPathwayReview(await getToken(), pathwayId, { decision, note: note || null, suggestions }),
    onSuccess: () => {
      setNote("");
      setSuggestions([]);
      queryClient.invalidateQueries({ queryKey: ["clinical-pathways"] });
    },
  });

  const ruleLabel = (ruleId: string | null) =>
    ruleId ? data?.rules.find((r) => r.id === ruleId)?.description.trim().slice(0, 60) ?? ruleId : "Pathway-level";

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/dashboard/pathway-review" className="text-sm text-rose-600 hover:underline">
        &larr; All pathways
      </Link>

      {isLoading && (
        <div className="mt-6 grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-24 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Could not load this pathway</p>
          <p className="mt-1 text-amber-800">
            {error instanceof ApiRequestError && error.status === 404
              ? "No pathway found with this id."
              : (error as Error).message}
          </p>
          <button type="button" onClick={() => refetch()} className="mt-2 text-rose-600 font-medium hover:underline">
            Retry
          </button>
        </div>
      )}

      {data && (
        <>
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-navy-700">{data.pathway_name}</h1>
            <p className="text-xs text-gray-400 mt-1 font-mono">{data.file_path}</p>
            <div className="mt-2 flex items-center gap-3 flex-wrap text-xs text-gray-500">
              <span>File status: <span className="font-medium text-gray-700">{data.file_status}</span></span>
              <span>{data.rules_count} {data.rules_count === 1 ? "rule" : "rules"}</span>
            </div>
          </div>

          {data.references.length > 0 && (
            <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs font-medium text-gray-500 mb-2">References</p>
              <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                {data.references.map((ref) => (
                  <li key={ref}>{ref}</li>
                ))}
              </ul>
            </div>
          )}

          {data.review_state === "changes_addressed" && (
            <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
              <p className="font-medium">The changes you asked for have been made</p>
              <p className="mt-1 text-indigo-800">
                This pathway has been updated since your last review. Your earlier
                request is below for comparison — please read the current rules and
                approve them, or ask for more changes.
              </p>
            </div>
          )}

          {data.review_state === "stale_review" && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-medium">This file changed since it was last reviewed</p>
              <p className="mt-1 text-amber-800">
                The decision below no longer applies to the current content — please review again.
              </p>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {data.rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onAddSuggestion={(s) => setSuggestions((prev) => [...prev, s])}
              />
            ))}
          </div>

          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-navy-700">Record a decision</h2>
            <p className="text-xs text-gray-500 mt-1">
              This records your decision — it does not change the file itself.
              An engineer flips the file&rsquo;s status once approved.
            </p>

            {suggestions.length > 0 && (
              <div className="mt-3 space-y-2">
                {suggestions.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs"
                  >
                    <div>
                      <p className="font-medium text-gray-700">{ruleLabel(s.rule_id)}</p>
                      <p className="text-gray-600 mt-0.5">
                        {s.field}: {s.current_value ?? "?"} &rarr; {s.suggested_value}
                      </p>
                      {s.rationale && <p className="text-gray-500 mt-0.5">{s.rationale}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSuggestions((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-gray-400 hover:text-red-600 shrink-0"
                      aria-label="Remove suggestion"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Notes (required if requesting changes)"
              rows={3}
              className="mt-3 w-full rounded-lg border border-gray-200 p-3 text-sm"
            />
            {review.isError && (
              <p className="mt-2 text-sm text-red-600">
                {review.error instanceof ApiRequestError
                  ? review.error.message
                  : "Could not record this decision."}
              </p>
            )}
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                disabled={review.isPending}
                onClick={() => review.mutate("approved")}
                className="px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-800 disabled:opacity-50"
              >
                {review.isPending && review.variables === "approved" ? "Approving…" : "Approve"}
              </button>
              <button
                type="button"
                disabled={review.isPending}
                onClick={() => review.mutate("changes_requested")}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                {review.isPending && review.variables === "changes_requested" ? "Sending…" : "Request changes"}
              </button>
            </div>
          </div>

          {data.review_history.length > 0 && (
            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-navy-700 mb-3">Review history</h2>
              <div className="space-y-3">
                {data.review_history.map((r) => (
                  <div key={r.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-sm font-medium text-gray-800">{r.decision}</span>
                      <span className="text-xs text-gray-400">{formatDateTime(r.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">by {r.reviewer_clerk_id}</p>
                    {r.note && <p className="text-sm text-gray-700 mt-1">{r.note}</p>}
                    {r.suggestions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {r.suggestions.map((s, idx) => (
                          <p key={idx} className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                            <span className="font-medium text-gray-700">{ruleLabel(s.rule_id)}</span>
                            {" — "}
                            {s.field}: {s.current_value ?? "?"} &rarr; {s.suggested_value}
                            {s.rationale ? ` (${s.rationale})` : ""}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
