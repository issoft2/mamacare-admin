/**
 * admin/src/lib/reviewApi.ts
 *
 * Self-contained client for GET/POST /symptoms/admin/unmapped-review —
 * deliberately NOT using @safeborn/api. That package (and @safeborn/types,
 * @safeborn/ui) doesn't exist anywhere on this machine despite being a
 * declared dependency — the existing Dashboard page that imports from it
 * is broken as checked out. Rather than guess at reconstructing a missing
 * package, this page brings its own small, plain-fetch client. See the
 * project notes for the decision to leave Dashboard's brokenness alone
 * for now rather than take a wider, more speculative fix in passing.
 *
 * Auth: the backend's require_clinical_reviewer() gate reads the Clerk
 * JWT directly (shared/auth/clinical_reviewer_gate.py) — same Bearer
 * token pattern as every other authenticated call in this system, just
 * assembled here by hand instead of through a shared client.
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

export interface UnmappedStatementReviewItem {
  id: string;
  user_id: string;
  gestational_week: number;
  phase: string;
  source: string;
  severity: string;
  urgency_score: number | null;
  urgency_tier: string | null;
  unmapped_statements: string[];
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface UnmappedStatementReviewListResponse {
  items: UnmappedStatementReviewItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface MarkUnmappedReviewedResponse {
  id: string;
  reviewed_at: string;
  reviewed_by: string;
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

export function fetchUnmappedReview(
  token: string | null,
  params: { limit?: number; offset?: number; includeReviewed?: boolean } = {}
): Promise<UnmappedStatementReviewListResponse> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));
  if (params.includeReviewed !== undefined) {
    query.set("include_reviewed", String(params.includeReviewed));
  }
  return authedFetch(`/symptoms/admin/unmapped-review?${query.toString()}`, token);
}

export function markUnmappedReviewed(
  token: string | null,
  logId: string
): Promise<MarkUnmappedReviewedResponse> {
  return authedFetch(`/symptoms/admin/unmapped-review/${logId}/reviewed`, token, {
    method: "POST",
  });
}
