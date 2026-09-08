/**
 * admin/src/app/dashboard/interconception-content/[slug]/page.tsx
 *
 * Read a piece of interconception guidance, edit it, and approve it or
 * send it back.
 *
 * The rule this screen exists to make visible: an approval is of exact
 * words. Editing a piece you have already approved takes it back down
 * immediately, because the hash of what you signed off no longer matches
 * what is stored. The banner says so while it is in that state rather than
 * leaving a reviewer to wonder why "approved" is not live.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiRequestError,
  fetchContentDetail,
  submitContentDecision,
  updateContent,
  type ContentDetail,
} from "@/lib/interconceptionContentApi";

function ReviewTrail({ detail }: { detail: ContentDetail }) {
  if (detail.reviews.length === 0) {
    return <p className="text-sm text-gray-500">No decisions recorded yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {detail.reviews.map((review) => (
        <li key={review.id} className="border-l-2 border-gray-200 pl-4">
          <p className="text-sm font-medium text-navy-700">
            {review.decision === "approved" ? "Approved" : "Changes requested"}
            <span className="font-normal text-gray-500"> by {review.reviewer}</span>
          </p>
          {review.note && <p className="text-sm text-gray-700 mt-1">{review.note}</p>}
          <p className="text-xs text-gray-400 mt-1">
            {new Date(review.created_at).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function InterconceptionContentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["interconception-content", slug],
    queryFn: async () => fetchContentDetail(slug, await getToken()),
  });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  //  Seeded once the piece loads, keyed on the slug rather than the whole
  //  object: re-seeding on every refetch would overwrite an edit in progress.
  useEffect(() => {
    if (data) {
      setTitle(data.title);
      setBody(data.body);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.slug]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["interconception-content"] });
  };

  const saveEdit = useMutation({
    mutationFn: async () => updateContent(slug, await getToken(), { title, body }),
    onSuccess: invalidate,
    onError: (e) =>
      setActionError(e instanceof ApiRequestError ? e.message : "Could not save."),
  });

  const decide = useMutation({
    mutationFn: async (decision: "approved" | "changes_requested") =>
      submitContentDecision(slug, await getToken(), {
        decision,
        note: note.trim() || null,
      }),
    onSuccess: () => {
      setNote("");
      invalidate();
    },
    onError: (e) =>
      setActionError(
        e instanceof ApiRequestError ? e.message : "Could not record that."
      ),
  });

  if (isLoading) return <p className="p-8 text-sm text-gray-500">Loading…</p>;
  if (error || !data) {
    return (
      <p className="p-8 text-sm text-red-700">
        {error instanceof ApiRequestError
          ? error.message
          : "Could not load this piece."}
      </p>
    );
  }

  const unsaved = title !== data.title || body !== data.body;

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href="/dashboard/interconception-content"
        className="text-sm text-gray-500 hover:text-navy-700"
      >
        ← Back to the queue
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-navy-800">{data.title}</h1>
      <p className="text-xs text-gray-400 mt-1 font-mono">{data.slug}</p>

      {data.edited_since_approval && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            Edited since you approved it — not being shown to anyone
          </p>
          <p className="mt-1 text-sm text-amber-800">
            An approval covers the exact words that were read. These are no longer
            those words, so it needs approving again.
          </p>
        </div>
      )}

      {data.is_servable && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-900">
            Live — mothers in interconception are seeing this
          </p>
        </div>
      )}

      <section className="mt-8">
        <label className="block text-sm font-medium text-navy-700">Title</label>
        <input
          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="mt-6 block text-sm font-medium text-navy-700">
          What she reads
        </label>
        <textarea
          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm min-h-[220px]"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        {unsaved && (
          <p className="mt-2 text-xs text-amber-700">
            Unsaved changes. Saving them takes this piece down until it is approved
            again.
          </p>
        )}

        <button
          onClick={() => saveEdit.mutate()}
          disabled={!unsaved || saveEdit.isPending}
          className="mt-3 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-navy-700 disabled:opacity-40"
        >
          {saveEdit.isPending ? "Saving…" : "Save changes"}
        </button>
      </section>

      <section className="mt-10 border-t border-gray-100 pt-8">
        <h2 className="text-lg font-semibold text-navy-800">Your decision</h2>
        <textarea
          className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm min-h-[110px]"
          placeholder="What needs changing, in your words. Required when sending it back."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {actionError && <p className="mt-3 text-sm text-red-700">{actionError}</p>}

        <div className="mt-4 flex gap-3 flex-wrap">
          <button
            onClick={() => decide.mutate("approved")}
            disabled={decide.isPending || unsaved}
            className="rounded-xl bg-green-700 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            Approve these words
          </button>
          <button
            onClick={() => decide.mutate("changes_requested")}
            disabled={decide.isPending}
            className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-red-700 disabled:opacity-40"
          >
            Request changes
          </button>
        </div>
        {unsaved && (
          <p className="mt-2 text-xs text-gray-500">
            Save your edits first — approving records the words as stored, not the
            ones on screen.
          </p>
        )}
      </section>

      <section className="mt-10 border-t border-gray-100 pt-8">
        <h2 className="text-lg font-semibold text-navy-800">Decision history</h2>
        <div className="mt-4">
          <ReviewTrail detail={data} />
        </div>
      </section>
    </div>
  );
}
