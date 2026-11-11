"use client";

import { useState } from "react";
import { Check, Clock, Loader2, X } from "lucide-react";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { usePendingShiftPlans, useReviewShiftPlan } from "@/features/shifts/hooks/useShiftPlans";
import { formatMove, usePendingShiftMoves, useReviewShiftMove } from "@/features/shifts/hooks/useShiftSchedule";
import { formatPlanDay } from "@/features/shifts/schemas/shiftPlan.schema";

const SOURCE_LABELS: Record<string, string> = {
  ONBOARDING: "New site assignment",
  COVER: "Leave cover",
  CHANGE_REQUEST: "Change request",
  MIGRATED: "Migrated",
};

/** Management / site supervisors: approve or decline cleaners' proposed site shifts. */
export function ShiftRequestsTab() {
  const { data: plans = [], isLoading } = usePendingShiftPlans();
  const review = useReviewShiftPlan();
  const { data: moves = [] } = usePendingShiftMoves();
  const reviewMove = useReviewShiftMove();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function decideMove(id: string, approve: boolean) {
    setError(null);
    try {
      await reviewMove.mutateAsync({ id, approve, note: notes[id]?.trim() || undefined });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  async function decide(id: string, decision: "approve" | "reject") {
    setError(null);
    try {
      await review.mutateAsync({ id, decision, note: notes[id]?.trim() || undefined });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-grey-400" />
      </div>
    );
  }

  return (
    <section className="rounded-2xl bg-surface p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-on-surface">Shift requests</h2>
      <p className="mb-4 text-xs text-grey-500">
        Cleaners propose the shifts they&apos;ll work at each site. Approved shifts drive check-in times and reminders.
      </p>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      {plans.length === 0 ? (
        <p className="text-sm text-grey-500">No shift requests waiting.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {plans.map((p) => (
            <li key={p.id} className="rounded-xl border border-grey-200 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface">
                    {p.cleanerName || "Cleaner"} · {p.siteName}
                  </p>
                  <p className="text-xs text-grey-500">
                    {SOURCE_LABELS[p.source] ?? p.source}
                    {p.submittedAt ? ` · ${new Date(p.submittedAt).toLocaleString()}` : ""}
                    {p.siteTimezone ? ` · ${p.siteTimezone}` : ""}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-on-surface">
                    <Clock size={12} aria-hidden /> {p.days.map(formatPlanDay).join(" · ")}
                  </p>
                  {p.cleanerNote && <p className="mt-1 text-xs italic text-grey-600">“{p.cleanerNote}”</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled={review.isPending}
                    onClick={() => decide(p.id, "reject")}
                    className="inline-flex items-center gap-1 rounded-full border border-grey-300 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-grey-50 disabled:opacity-50"
                  >
                    <X size={14} /> Decline
                  </button>
                  <button
                    type="button"
                    disabled={review.isPending}
                    onClick={() => decide(p.id, "approve")}
                    className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    <Check size={14} /> Approve
                  </button>
                </div>
              </div>
              <input
                value={notes[p.id] ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [p.id]: e.target.value }))}
                maxLength={1000}
                placeholder="Note (required to decline)"
                className="mt-2 w-full rounded-lg border border-grey-200 px-3 py-1.5 text-xs"
              />
            </li>
          ))}
        </ul>
      )}

      <h3 className="mb-2 mt-6 text-sm font-semibold text-on-surface">One-day shift moves</h3>
      {moves.length === 0 ? (
        <p className="text-sm text-grey-500">No shift moves waiting.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {moves.map((m) => (
            <li key={m.id} className="rounded-xl border border-grey-200 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface">
                    {m.cleanerName || "Cleaner"} · {m.siteName}
                  </p>
                  <p className="text-xs text-grey-600">
                    {m.date}: {m.originalStart.slice(0, 5)}–{m.originalEnd.slice(0, 5)} moved {formatMove(m.moveMinutes)}
                  </p>
                  {m.note && <p className="mt-1 text-xs italic text-grey-600">“{m.note}”</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled={reviewMove.isPending}
                    onClick={() => decideMove(m.id, false)}
                    className="inline-flex items-center gap-1 rounded-full border border-grey-300 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-grey-50 disabled:opacity-50"
                  >
                    <X size={14} /> Decline
                  </button>
                  <button
                    type="button"
                    disabled={reviewMove.isPending}
                    onClick={() => decideMove(m.id, true)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    <Check size={14} /> Approve
                  </button>
                </div>
              </div>
              <input
                value={notes[m.id] ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [m.id]: e.target.value }))}
                maxLength={1000}
                placeholder="Note (required to decline)"
                className="mt-2 w-full rounded-lg border border-grey-200 px-3 py-1.5 text-xs"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
