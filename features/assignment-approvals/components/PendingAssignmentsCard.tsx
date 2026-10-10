"use client";

import { Check, MapPin, Loader2 } from "lucide-react";
import {
  useApproveAssignment,
  useMyPendingAssignments,
} from "@/features/assignment-approvals/hooks/useAssignmentApprovals";

/** Cleaner/supervisor card: slots they've been assigned to that await their acceptance. */
export function PendingAssignmentsCard() {
  const { data: pending = [], isLoading } = useMyPendingAssignments();
  const approve = useApproveAssignment();

  if (isLoading || pending.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
          {pending.length}
        </span>
        <h3 className="text-sm font-semibold text-on-surface">Assignments to accept</h3>
      </div>
      <ul className="flex flex-col gap-2">
        {pending.map((p) => (
          <li
            key={`${p.type}-${p.profileId}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-on-surface">{p.label}</p>
              <p className="flex items-center gap-1 truncate text-xs text-grey-500">
                <MapPin size={12} aria-hidden /> {p.locationName}
              </p>
            </div>
            <button
              type="button"
              disabled={approve.isPending}
              onClick={() => approve.mutate({ type: p.type, profileId: p.profileId })}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {approve.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <Check size={14} /> Accept
                </>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
