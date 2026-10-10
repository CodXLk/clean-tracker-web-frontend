"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { ModalPortal } from "@/components/shared/ModalPortal";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useMySites } from "@/features/attendance/hooks/useAttendance";
import { useCreateLeave } from "@/features/leave/hooks/useLeave";
import { toLocalDateString } from "@/features/tasks/lib/task-utils";

export function LeaveRequestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: sites = [] } = useMySites();
  const create = useCreateLeave();
  const today = toLocalDateString(new Date());

  const [type, setType] = useState<"DAY_WISE" | "SITE_SPECIFIC">("DAY_WISE");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [siteIds, setSiteIds] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function toggleSite(id: string) {
    setSiteIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  function submit() {
    setError(null);
    if (!startDate || !endDate) return setError("Choose a start and end date.");
    if (endDate < startDate) return setError("End date cannot be before start date.");
    if (type === "SITE_SPECIFIC" && siteIds.length === 0) return setError("Select at least one site.");
    create.mutate(
      {
        type,
        startDate,
        endDate,
        siteIds: type === "SITE_SPECIFIC" ? siteIds : undefined,
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => onClose(),
        onError: (e) => setError(getErrorMessage(e)),
      },
    );
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-on-surface">Request leave</h2>
            <button type="button" aria-label="Close" onClick={onClose} className="rounded-full p-1 text-grey-400 hover:bg-grey-100">
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("DAY_WISE")}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${type === "DAY_WISE" ? "border-primary bg-primary/10 text-ink" : "border-grey-300 text-grey-600"}`}
              >
                All my sites
              </button>
              <button
                type="button"
                onClick={() => setType("SITE_SPECIFIC")}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${type === "SITE_SPECIFIC" ? "border-primary bg-primary/10 text-ink" : "border-grey-300 text-grey-600"}`}
              >
                Specific site(s)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-medium text-grey-600">From</span>
                <input type="date" value={startDate} min={today} onChange={(e) => setStartDate(e.target.value)}
                  className="h-11 rounded-xl border border-grey-300 px-3 text-sm outline-none focus:border-primary" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-medium text-grey-600">To</span>
                <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)}
                  className="h-11 rounded-xl border border-grey-300 px-3 text-sm outline-none focus:border-primary" />
              </label>
            </div>

            {type === "SITE_SPECIFIC" && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-grey-600">Sites</span>
                <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-xl border border-grey-200 p-2">
                  {sites.length === 0 ? (
                    <p className="px-1 py-2 text-xs text-grey-500">No assigned sites.</p>
                  ) : (
                    sites.map((s) => (
                      <label key={s.siteId} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-grey-50">
                        <input type="checkbox" checked={siteIds.includes(s.siteId)} onChange={() => toggleSite(s.siteId)} />
                        {s.siteName}
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium text-grey-600">Reason (optional)</span>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
                className="rounded-xl border border-grey-300 px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>

            {error && <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-full border border-grey-300 px-4 py-2 text-sm font-medium text-on-surface hover:bg-grey-50">
                Cancel
              </button>
              <button type="button" onClick={submit} disabled={create.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {create.isPending ? <Loader2 size={16} className="animate-spin" /> : "Submit"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
