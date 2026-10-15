"use client";

import { useMemo, useState } from "react";
import { X, Trash2, Plus, Check, Sparkles, ShieldCheck } from "lucide-react";
import { ModalPortal } from "@/components/shared/ModalPortal";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useCleaners } from "@/features/cleaners/hooks/useCleaners";
import { useEligibleWorkOrderSupervisors } from "@/features/work-orders/hooks/useWorkOrders";
import { useAddLeaveCover, useRemoveLeaveCover } from "@/features/leave/hooks/useLeave";
import type { CoverRole, LeaveRequest } from "@/features/leave/schemas/leave.schema";

const roleKey = (siteId: string, role: CoverRole) => `${siteId}:${role}`;

/** Management arranges a replacement per affected site + role for a leave request. */
export function LeaveCoversModal({ leave, onClose }: { leave: LeaveRequest; onClose: () => void }) {
  const { data: cleaners = [] } = useCleaners();
  const { data: supervisors = [] } = useEligibleWorkOrderSupervisors(true);
  const addCover = useAddLeaveCover();
  const removeCover = useRemoveLeaveCover();
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const cleanerOptions = useMemo(
    () => cleaners.map((c) => ({ value: c.id, label: `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "Cleaner" })),
    [cleaners],
  );
  const supervisorOptions = useMemo(
    () => supervisors.map((s) => ({ value: s.id, label: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || "Supervisor" })),
    [supervisors],
  );

  // One cover per (site, role).
  const coverByKey = useMemo(() => {
    const map = new Map<string, (typeof leave.covers)[number]>();
    for (const c of leave.covers) map.set(roleKey(c.siteId, c.coverRole), c);
    return map;
  }, [leave.covers]);

  function nominate(siteId: string, role: CoverRole) {
    const key = roleKey(siteId, role);
    const chosen = selections[key];
    if (!chosen) return;
    setError(null);
    addCover.mutate(
      {
        leaveId: leave.id,
        siteId,
        coverRole: role,
        coveringUserId: role === "SUPERVISING" ? chosen : undefined,
        coveringCleanerId: role === "CLEANING" ? chosen : undefined,
      },
      {
        onSuccess: () => setSelections((p) => ({ ...p, [key]: "" })),
        onError: (e) => setError(getErrorMessage(e)),
      },
    );
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-on-surface">Arrange cover</h2>
              <p className="text-xs text-grey-500">
                {leave.requesterName} · {leave.startDate} → {leave.endDate}
              </p>
            </div>
            <button type="button" aria-label="Close" onClick={onClose} className="rounded-full p-1 text-grey-400 hover:bg-grey-100">
              <X size={18} />
            </button>
          </div>

          {error && <p role="alert" className="mb-3 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}

          {leave.affectedSites.length === 0 ? (
            <p className="text-sm text-grey-500">No affected sites found for this request.</p>
          ) : (
            <ul className="flex max-h-96 flex-col gap-3 overflow-y-auto">
              {leave.affectedSites.map((s) => {
                const role = s.coverRole as CoverRole;
                const key = roleKey(s.siteId, role);
                const cover = coverByKey.get(key);
                const isSupervising = role === "SUPERVISING";
                const options = isSupervising ? supervisorOptions : cleanerOptions;
                return (
                  <li key={key} className="rounded-xl border border-grey-200 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-sm font-medium text-on-surface">{s.siteName}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isSupervising ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"
                        }`}
                      >
                        {isSupervising ? <ShieldCheck size={10} /> : <Sparkles size={10} />}
                        {isSupervising ? "Supervising" : "Cleaning"}
                      </span>
                    </div>
                    {cover ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-sm text-on-surface">
                          {cover.coveringName}
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cover.approvalStatus === "APPROVED" ? "bg-success/10 text-success" : "bg-amber-100 text-amber-700"}`}>
                            {cover.approvalStatus === "APPROVED" ? (
                              <span className="inline-flex items-center gap-1"><Check size={10} /> Accepted</span>
                            ) : (
                              "Pending"
                            )}
                          </span>
                        </span>
                        <button
                          type="button"
                          aria-label="Remove cover"
                          onClick={() => removeCover.mutate(cover.id)}
                          className="rounded-full p-1.5 text-grey-400 hover:bg-error/10 hover:text-error"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          value={selections[key] ?? ""}
                          onChange={(e) => setSelections((p) => ({ ...p, [key]: e.target.value }))}
                          className="h-10 flex-1 rounded-lg border border-grey-300 bg-white px-2.5 text-sm outline-none focus:border-primary"
                        >
                          <option value="">
                            {isSupervising ? "Select replacement supervisor…" : "Select replacement cleaner…"}
                          </option>
                          {options.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!selections[key] || addCover.isPending}
                          onClick={() => nominate(s.siteId, role)}
                          className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                        >
                          <Plus size={13} /> Add
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-4 flex justify-end">
            <button type="button" onClick={onClose} className="rounded-full border border-grey-300 px-4 py-2 text-sm font-medium text-on-surface hover:bg-grey-50">
              Done
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
