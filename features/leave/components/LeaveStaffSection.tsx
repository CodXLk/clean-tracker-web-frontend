"use client";

import { useState } from "react";
import { CalendarClock, Check, Loader2, Plus } from "lucide-react";
import { LeaveRequestModal } from "@/features/leave/components/LeaveRequestModal";
import {
  useAcceptCover,
  useCancelLeave,
  useMyCovers,
  useMyLeave,
} from "@/features/leave/hooks/useLeave";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-success/10 text-success",
  REJECTED: "bg-error/10 text-error",
  CANCELLED: "bg-grey-100 text-grey-500",
};

function fmt(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString([], { month: "short", day: "numeric" });
}

/** Cleaner/supervisor leave: request button, cover acceptances, and my request history. */
export function LeaveStaffSection() {
  const [open, setOpen] = useState(false);
  const { data: myLeave = [] } = useMyLeave();
  const { data: covers = [] } = useMyCovers();
  const cancel = useCancelLeave();
  const accept = useAcceptCover();

  return (
    <section className="rounded-2xl bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock size={18} className="text-ink" aria-hidden />
          <h2 className="text-sm font-semibold text-on-surface">Leave</h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          <Plus size={14} /> Request
        </button>
      </div>

      {covers.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold text-grey-600">Cover requests to accept</p>
          <ul className="flex flex-col gap-2">
            {covers.map((c) => (
              <li key={c.coverId} className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-on-surface">{c.siteName}</p>
                  <p className="truncate text-xs text-grey-500">
                    Cover for {c.requesterName} · {fmt(c.startDate)}–{fmt(c.endDate)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={accept.isPending}
                  onClick={() => accept.mutate(c.coverId)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {accept.isPending ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Accept</>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {myLeave.length === 0 ? (
        <p className="text-sm text-grey-500">No leave requests yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {myLeave.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 rounded-xl border border-grey-200 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-on-surface">
                  {fmt(l.startDate)} – {fmt(l.endDate)}
                  <span className="ml-1 text-xs font-normal text-grey-500">
                    {l.type === "SITE_SPECIFIC" ? "(specific sites)" : "(all sites)"}
                  </span>
                </p>
                {l.reason && <p className="truncate text-xs text-grey-500">{l.reason}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[l.status] ?? "bg-grey-100 text-grey-600"}`}>
                  {l.status}
                </span>
                {l.status === "PENDING" && (
                  <button
                    type="button"
                    disabled={cancel.isPending}
                    onClick={() => cancel.mutate(l.id)}
                    className="rounded-full border border-grey-300 px-2.5 py-1 text-[11px] font-medium text-grey-600 hover:bg-grey-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <LeaveRequestModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
