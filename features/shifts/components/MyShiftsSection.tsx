"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Clock, Loader2, Pencil, Plus } from "lucide-react";
import { useMySites } from "@/features/attendance/hooks/useAttendance";
import { useMyShiftPlans, useSubmitShiftPlan } from "@/features/shifts/hooks/useShiftPlans";
import { ShiftPlanDialog } from "@/features/shifts/components/ShiftPlanDialog";
import { formatPlanDay, type ShiftPlan } from "@/features/shifts/schemas/shiftPlan.schema";

interface SiteRow {
  siteId: string;
  siteName: string;
  approved?: ShiftPlan;
  pending?: ShiftPlan;
  rejected?: ShiftPlan;
}

/** Cleaner's shifts per site: approved shifts in force, pending changes, and declined requests. */
export function MyShiftsSection() {
  const plansQuery = useMyShiftPlans();
  const sitesQuery = useMySites();
  const submit = useSubmitShiftPlan();
  const [editing, setEditing] = useState<SiteRow | null>(null);

  const rows = useMemo(() => {
    const bySite = new Map<string, SiteRow>();
    for (const s of sitesQuery.data ?? []) {
      bySite.set(s.siteId, { siteId: s.siteId, siteName: s.siteName });
    }
    for (const p of plansQuery.data ?? []) {
      const row = bySite.get(p.siteId) ?? { siteId: p.siteId, siteName: p.siteName };
      if (p.status === "APPROVED" && !row.approved) row.approved = p;
      if (p.status === "PENDING" && !row.pending) row.pending = p;
      if (p.status === "REJECTED" && !row.rejected) row.rejected = p;
      bySite.set(p.siteId, row);
    }
    return [...bySite.values()].sort((a, b) => a.siteName.localeCompare(b.siteName));
  }, [plansQuery.data, sitesQuery.data]);

  const loading = plansQuery.isLoading || sitesQuery.isLoading;

  return (
    <section className="rounded-2xl bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <CalendarClock size={18} className="text-ink" aria-hidden />
        <h2 className="text-sm font-semibold text-on-surface">My shifts</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-grey-400" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-grey-500">You aren&apos;t assigned to any sites yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => {
            // A newer decline than the pending/approved plan is worth showing.
            const showRejected =
              r.rejected && (!r.pending || (r.rejected.reviewedAt ?? "") > (r.pending.submittedAt ?? ""));
            return (
              <li key={r.siteId} className="rounded-xl border border-grey-200 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-on-surface">{r.siteName}</p>
                    {r.approved ? (
                      <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-grey-600">
                        <Clock size={12} aria-hidden /> {r.approved.days.map(formatPlanDay).join(" · ")}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-grey-500">No approved shifts yet.</p>
                    )}
                    {r.pending && (
                      <p className="mt-1 text-xs text-amber-700">
                        Awaiting approval: {r.pending.days.map(formatPlanDay).join(" · ")}
                      </p>
                    )}
                    {showRejected && (
                      <p className="mt-1 text-xs text-danger">
                        Declined{r.rejected!.reviewedByName ? ` by ${r.rejected!.reviewedByName}` : ""}:{" "}
                        {r.rejected!.reviewNote}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing(r)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-grey-300 px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-grey-50"
                  >
                    {r.approved || r.pending ? <Pencil size={13} /> : <Plus size={13} />}
                    {r.approved ? "Request change" : r.pending ? "Edit request" : "Add shifts"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <ShiftPlanDialog
          open
          onClose={() => setEditing(null)}
          siteId={editing.siteId}
          title={editing.approved ? `Change shifts · ${editing.siteName}` : `Shifts · ${editing.siteName}`}
          description="Changes are applied once a manager or the site's supervisor approves them."
          submitLabel="Send for approval"
          onSubmit={(plan) => submit.mutateAsync({ siteId: editing.siteId, plan })}
        />
      )}
    </section>
  );
}
