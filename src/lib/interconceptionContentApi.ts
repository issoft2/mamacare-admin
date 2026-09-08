/**
 * admin/src/lib/interconceptionContentApi.ts
 *
 * Client for the interconception content review flow:
 *   GET    /content/interconception/review
 *   GET    /content/interconception/review/:slug
 *   POST   /content/interconception/review
 *   PATCH  /content/interconception/review/:slug
 *   POST   /content/interconception/review/:slug/decision
 *
 * Same plain-fetch shape as pathwayReviewApi.ts — see that file for why
 * this doesn't go through @safeborn/api. Every route is gated by
 * shared/auth/clinical_reviewer_gate.py, the same allow-list as pathway
 * sign-off and deliberately not the general admin one: approving words a
 * mother reads as guidance is clinical authority, not ops access.
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

export type ContentStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "changes_requested";

export type ContentDecision = "approved" | "changes_requested";

export type ContentCategory =
  | "recovery"
  | "birth_spacing"
  | "family_planning"
  | "nutrition"
  | "preconception"
  | "previous_pregnancy_review";

export interface ContentReviewRecord {
  id: string;
  decision: ContentDecision;
  reviewer: string;
  note: string | null;
  content_hash: string;
  created_at: string;
}

export interface ContentItem {
  id: string;
  slug: string;
  title: string;
  body: string;
  category: ContentCategory;
  weeks_from: number | null;
  sources: Record<string, unknown> | null;
  content_version: string;
  status: ContentStatus;
  /**
   * Whether a mother would actually see this right now. NOT the same as
   * status === "approved": editing an approved piece withdraws it, and
   * only this field reflects that.
   */
  is_servable: boolean;
  /** Approved once, but the words changed since — so it is not being served. */
  edited_since_approval: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentDetail extends ContentItem {
  reviews: ContentReviewRecord[];
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

export function fetchContentList(token: string | null): Promise<ContentItem[]> {
  return authedFetch("/content/interconception/review", token);
}

export function fetchContentDetail(
  slug: string,
  token: string | null
): Promise<ContentDetail> {
  return authedFetch(`/content/interconception/review/${slug}`, token);
}

export function createContent(
  token: string | null,
  input: {
    slug: string;
    title: string;
    body: string;
    category: ContentCategory;
    weeks_from?: number | null;
    sources?: Record<string, unknown> | null;
  }
): Promise<ContentItem> {
  return authedFetch("/content/interconception/review", token, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateContent(
  slug: string,
  token: string | null,
  input: Partial<{
    title: string;
    body: string;
    category: ContentCategory;
    weeks_from: number | null;
    sources: Record<string, unknown> | null;
  }>
): Promise<ContentItem> {
  return authedFetch(`/content/interconception/review/${slug}`, token, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function submitContentDecision(
  slug: string,
  token: string | null,
  input: { decision: ContentDecision; note?: string | null }
): Promise<ContentItem> {
  return authedFetch(`/content/interconception/review/${slug}/decision`, token, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
