"use client";

import { useState } from "react";
import { Loader2, Users } from "lucide-react";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { LeaveCoversModal } from "@/features/leave/components/LeaveCoversModal";
import { useApproveLeave, useLeaveRequests, useRejectLeave } from "@/features/leave/hooks/useLeave";
import type { LeaveRequest } from "@/features/leave/schemas/leave.schema";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-success/10 text-success",
  REJECTED: "bg-error/10 text-error",
  CANCELLED: "bg-grey-100 text-grey-500",
};

const FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;
type Filter = (typeof FILTERS)[number];
const filterLabel = (f: Filter) => (f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase());

function coverSummary(l: LeaveRequest): string {
  if (l.covers.length === 0) return "—";
  const accepted = l.covers.filter((c) => c.approvalStatus === "APPROVED").length;
  return `${accepted}/${l.covers.length} accepted`;
}

export function LeaveManagementTab() {
  const [filter, setFilter] = useState<Filter>("PENDING");
  const { data: requests = [], isLoading } = useLeaveRequests(filter === "ALL" ? undefined : filter);
  const approve = useApproveLeave();
  const reject = useRejectLeave();
  const [managing, setManaging] = useState<LeaveRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allCoversAccepted = (l: LeaveRequest) =>
    l.covers.length === 0 || l.covers.every((c) => c.approvalStatus === "APPROVED");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <FilterSelect<Filter> options={[...FILTERS]} value={filter} onChange={setFilter} getLabel={filterLabel} label="" />
      </div>

      {error && <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}

      {isLoading ? (
        <div className="flex justify-center py-8 text-grey-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : requests.length === 0 ? (
        <p className="rounded-xl border border-dashed border-grey-200 px-3 py-8 text-center text-sm text-grey-500">
          No leave requests.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-grey-300 text-xs uppercase tracking-wide text-grey-500">
                  <th className="px-5 py-3 font-medium">Requester</th>
                  <th className="px-5 py-3 font-medium">Dates</th>
                  <th className="px-5 py-3 font-medium">Scope</th>
                  <th className="px-5 py-3 font-medium">Covers</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((l) => (
                  <tr key={l.id} className="border-b border-grey-100 align-top last:border-0">
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-on-surface">{l.requesterName}</span>
                      <span className="block text-xs text-grey-500">
                        {l.requesterRole === "SUPERVISOR" ? "Supervisor" : "Cleaner"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-grey-700">
                      {l.startDate} → {l.endDate}
                      {l.reason && <span className="block text-xs text-grey-500">“{l.reason}”</span>}
                    </td>
                    <td className="px-5 py-3.5 text-grey-700">
                      {l.type === "SITE_SPECIFIC" ? "Specific sites" : "All sites"}
                    </td>
                    <td className="px-5 py-3.5 text-grey-700">{coverSummary(l)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[l.status] ?? "bg-grey-100 text-grey-600"}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {l.status === "PENDING" ? (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setManaging(l)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-grey-300 px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-grey-50"
                          >
                            <Users size={14} /> Arrange cover
                          </button>
                          <button
                            type="button"
                            disabled={approve.isPending || !allCoversAccepted(l)}
                            title={allCoversAccepted(l) ? undefined : "All covers must be accepted first"}
                            onClick={() => approve.mutate(l.id, { onError: (e) => setError(getErrorMessage(e)) })}
                            className="rounded-full bg-success px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={reject.isPending}
                            onClick={() => reject.mutate(l.id, { onError: (e) => setError(getErrorMessage(e)) })}
                            className="rounded-full border border-error/40 px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/5 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-right text-grey-400">—</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {managing && <LeaveCoversModal leave={managing} onClose={() => setManaging(null)} />}
    </div>
  );
}
