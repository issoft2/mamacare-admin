/**
 * admin/src/lib/pathwayReviewApi.ts
 *
 * Self-contained client for the Pathway Review & Sign-off flow:
 *   GET  /clinical-pathways
 *   GET  /clinical-pathways/:pathway_id
 *   POST /clinical-pathways/:pathway_id/review
 *
 * Same plain-fetch pattern as reviewApi.ts (see that file for why this
 * doesn't go through @safeborn/api). Backend: shared/auth/clinical_reviewer_gate.py
 * gates every route here — same allow-list and audience as the unmapped
 * statements queue.
 */

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

export type ReviewState =
  | "awaiting_review"
  // Her requested changes have been implemented and it is ready for her
  // again. Distinct from stale_review, which means content she APPROVED
  // was altered underneath her — opposite meaning, opposite tone.
  | "changes_addressed"
  | "stale_review"
  | "changes_requested"
  | "approved_pending_deploy"
  | "deployed";

export type ReviewDecision = "approved" | "changes_requested";

export interface PathwaySuggestion {
  rule_id: string | null;
  field: string;
  current_value: string | null;
  suggested_value: string;
  rationale: string | null;
}

export interface PathwayReviewRecord {
  id: string;
  decision: ReviewDecision;
  reviewer_clerk_id: string;
  note: string | null;
  suggestions: PathwaySuggestion[];
  content_hash: string;
  created_at: string;
}

export interface PathwayListItem {
  pathway_id: string;
  pathway_name: string;
  file_path: string;
  file_status: string;
  requires_clinical_signoff: boolean;
  approved_by: string | null;
  approved_at: string | null;
  rules_count: number;
  references: string[];
  content_hash: string;
  /** Clinical area — "Labour", "Postpartum", … Derived server-side; never
   *  stored in the reviewed YAML, so grouping cannot invalidate a sign-off. */
  group: string;
  review_state: ReviewState;
  latest_review: PathwayReviewRecord | null;
}

export interface PathwayListResponse {
  items: PathwayListItem[];
  total: number;
}

export interface PathwayRuleSummary {
  id: string;
  priority: string;
  description: string;
  conditions: Record<string, unknown>;
  on_missing_field: string | null;
  urgency: string;
  reason: string;
  recommendation: string;
  bypasses_trend_scoring: boolean;
}

export interface PathwayDetailResponse extends PathwayListItem {
  rules: PathwayRuleSummary[];
  review_history: PathwayReviewRecord[];
}

export interface SubmitPathwayReviewResponse {
  pathway_id: string;
  review: PathwayReviewRecord;
  review_state: ReviewState;
}

async function authedFetch<T>(
  path: string,
  token: string | null,
  init?: RequestInit
): Promise<T> {
  if (!token) {
    throw new ApiRequestError(401, "Not signed in.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
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

export function fetchPathways(
  token: string | null
): Promise<PathwayListResponse> {
  return authedFetch("/clinical-pathways", token);
}

export function fetchPathwayDetail(
  token: string | null,
  pathwayId: string
): Promise<PathwayDetailResponse> {
  return authedFetch(`/clinical-pathways/${pathwayId}`, token);
}

export function submitPathwayReview(
  token: string | null,
  pathwayId: string,
  body: {
    decision: ReviewDecision;
    note?: string | null;
    suggestions?: PathwaySuggestion[];
  }
): Promise<SubmitPathwayReviewResponse> {
  return authedFetch(`/clinical-pathways/${pathwayId}/review`, token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
