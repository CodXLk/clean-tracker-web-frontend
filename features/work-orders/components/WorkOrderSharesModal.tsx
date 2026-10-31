"use client";

import { useState } from "react";
import { X, Loader2, Check, Info } from "lucide-react";
import { ModalPortal } from "@/components/shared/ModalPortal";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useMe } from "@/features/auth/hooks/useMe";
import {
  useApproveHours,
  useSaveSupervisorHours,
  useWorkOrderHours,
} from "@/features/work-orders/hooks/useWorkOrderHours";
import { useUpdateWorkOrderStatus } from "@/features/work-orders/hooks/useWorkOrders";
import type { WorkOrderHourEntry } from "@/features/work-orders/schemas/workOrderHours.schema";

const MANAGEMENT_ROLES = new Set(["SUPER_ADMIN", "COMPANY_ADMIN", "CLIENT_SERVICE_MANAGER"]);

function money(v: number): string {
  return v.toLocaleString(undefined, { style: "currency", currency: "AUD" });
}

function show(v: number | null | undefined, perHour: boolean): string {
  if (v == null) return "—";
  return perHour ? `${v}h` : money(v);
}

/**
 * Cleaners share review. Supervisors set each cleaner's share of the hours/amount (locked once
 * management approves); management sets and approves the final share. With {@code completeTasks}
 * the supervisor's save also marks the work order's tasks completed.
 */
export function WorkOrderSharesModal({
  workOrderId,
  poId,
  completeTasks = false,
  onClose,
  onCompleted,
}: {
  workOrderId: string;
  poId?: string | null;
  completeTasks?: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}) {
  const isManagement = MANAGEMENT_ROLES.has(useMe().data?.role ?? "");
  const { data: review, isLoading, isError, error: loadError } = useWorkOrderHours(workOrderId);
  const saveSupervisor = useSaveSupervisorHours();
  const approve = useApproveHours();
  const updateStatus = useUpdateWorkOrderStatus();
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const perHour = review?.mode === "RATE_PER_HOUR";
  const rate = review?.rate ?? 0;
  const allocated = review?.allocatedAmount ?? null;
  const entries = review?.entries ?? [];
  const locked = !isManagement && !!review?.approved;
  const unit = perHour ? "hours" : "amount";
  const busy = saveSupervisor.isPending || approve.isPending || updateStatus.isPending;

  // Starting value of the tier this user edits, falling back down the tiers.
  function initial(e: WorkOrderHourEntry): number | null | undefined {
    if (perHour) {
      return isManagement ? (e.adminHours ?? e.supervisorHours ?? e.systemHours) : (e.supervisorHours ?? e.systemHours);
    }
    return isManagement ? (e.adminAmount ?? e.supervisorAmount ?? e.systemAmount) : (e.supervisorAmount ?? e.systemAmount);
  }

  function raw(e: WorkOrderHourEntry): string {
    if (edits[e.id] !== undefined) return edits[e.id]!;
    const v = initial(e);
    return v == null ? "" : String(v);
  }

  function parsed(e: WorkOrderHourEntry): number | null {
    const s = raw(e).trim();
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  const total = entries.reduce((sum, e) => sum + (parsed(e) ?? 0), 0);
  const totalAmount = perHour ? total * rate : total;
  const overAllocated = !perHour && allocated != null && total > allocated + 0.001;

  function validate(): { id: string; hours?: number; amount?: number }[] | null {
    if (entries.some((e) => parsed(e) == null)) {
      setError(`Enter a valid ${unit} for every cleaner.`);
      return null;
    }
    if (overAllocated) {
      setError(`The total share (${money(total)}) exceeds the cleaning allocated amount (${money(allocated!)}).`);
      return null;
    }
    return entries.map((e) => (perHour ? { id: e.id, hours: parsed(e)! } : { id: e.id, amount: parsed(e)! }));
  }

  function markCompleted() {
    updateStatus.mutate(
      { id: workOrderId, status: "TASKS_COMPLETED" },
      {
        onSuccess: () => {
          onCompleted?.();
          onClose();
        },
        onError: (e) => setError(getErrorMessage(e)),
      },
    );
  }

  function onSave() {
    setError(null);
    if (completeTasks && entries.length === 0) {
      markCompleted();
      return;
    }
    const payload = validate();
    if (!payload) return;
    saveSupervisor.mutate(
      { workOrderId, entries: payload },
      {
        onSuccess: () => {
          setEdits({});
          if (completeTasks) markCompleted();
          else onClose();
        },
        onError: (e) => setError(getErrorMessage(e)),
      },
    );
  }

  function onApprove() {
    setError(null);
    const payload = validate();
    if (!payload) return;
    approve.mutate(
      { workOrderId, entries: payload },
      { onSuccess: () => onClose(), onError: (e) => setError(getErrorMessage(e)) },
    );
  }

  const instruction = isManagement
    ? `Set the final ${unit} for each cleaner and approve. The work order can't be sent to Client Review Pending or Completed until the final share is approved.`
    : locked
      ? "The final share has been approved by management. It can no longer be edited."
      : completeTasks
        ? `Set each cleaner's share of the ${unit} before marking the tasks completed.`
        : `Set each cleaner's share of the ${unit}. You can edit it until management approves the final share.`;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
        <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white p-5 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-on-surface">
                {completeTasks ? "Mark tasks completed" : "Cleaners share"}
              </h2>
              <p className="text-xs text-grey-500">
                {poId ? `PO ${poId} · ` : ""}
                {perHour ? `Hours · ${money(rate)}/hr` : `Amount${allocated != null ? ` · ${money(allocated)} allocated` : ""}`}
                {review?.approved ? " · Final approved" : review?.supervisorSubmitted ? " · Supervisor share set" : ""}
              </p>
            </div>
            <button type="button" aria-label="Close" onClick={onClose} className="rounded-full p-1 text-grey-400 hover:bg-grey-100">
              <X size={18} />
            </button>
          </div>

          <p className="mb-3 flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-grey-700">
            <Info size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            {instruction}
          </p>

          {error && <p role="alert" className="mb-3 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}

          {isLoading ? (
            <div className="flex justify-center py-10 text-grey-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : isError ? (
            <p className="py-8 text-center text-sm text-error">{getErrorMessage(loadError)}</p>
          ) : entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-grey-500">No cleaners are assigned to this work order.</p>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-grey-200 text-left text-xs text-grey-500">
                    <th className="py-2 pr-2">Cleaner</th>
                    {perHour && <th className="py-2 pr-2">Date</th>}
                    <th className="py-2 pr-2 text-right">{perHour ? "Recorded" : "Suggested"}</th>
                    <th className="py-2 pr-2 text-right">Supervisor share</th>
                    <th className="py-2 pr-2 text-right">Final share</th>
                    {perHour && <th className="py-2 text-right">Amount</th>}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => {
                    const sys = perHour ? e.systemHours : e.systemAmount;
                    const sup = perHour ? e.supervisorHours : e.supervisorAmount;
                    const fin = perHour ? e.adminHours : e.adminAmount;
                    const input = (
                      <input
                        type="number"
                        min={0}
                        step={perHour ? "0.25" : "0.01"}
                        aria-label={`${e.cleanerName ?? "Cleaner"} ${unit}`}
                        value={raw(e)}
                        disabled={busy}
                        onChange={(ev) => setEdits((p) => ({ ...p, [e.id]: ev.target.value }))}
                        className="h-8 w-24 rounded-lg border border-grey-300 px-2 text-right text-sm outline-none focus:border-primary"
                      />
                    );
                    return (
                      <tr key={e.id} className="border-b border-grey-100">
                        <td className="py-2 pr-2 font-medium text-on-surface">{e.cleanerName}</td>
                        {perHour && <td className="py-2 pr-2 text-grey-600">{e.entryDate ?? "—"}</td>}
                        <td className="py-2 pr-2 text-right text-grey-500">{show(sys, perHour)}</td>
                        <td className="py-2 pr-2 text-right">
                          {isManagement || locked ? <span className="text-grey-600">{show(sup, perHour)}</span> : input}
                        </td>
                        <td className="py-2 pr-2 text-right">
                          {isManagement ? input : (
                            <span className={fin == null ? "text-grey-400" : "font-medium text-on-surface"}>
                              {review?.approved ? show(fin, perHour) : "Pending approval"}
                            </span>
                          )}
                        </td>
                        {perHour && <td className="py-2 text-right text-grey-700">{money((parsed(e) ?? 0) * rate)}</td>}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="font-semibold text-on-surface">
                    <td className="py-2 pr-2" colSpan={perHour ? 5 : 3}>Total</td>
                    <td className={`py-2 text-right ${overAllocated ? "text-error" : ""}`}>
                      {perHour ? `${total.toFixed(2)}h · ${money(totalAmount)}` : money(totalAmount)}
                    </td>
                  </tr>
                  {!perHour && allocated != null && (
                    <tr className="text-xs text-grey-500">
                      <td className="pb-2 pr-2" colSpan={3}>Remaining of allocated amount</td>
                      <td className={`pb-2 text-right ${overAllocated ? "text-error" : ""}`}>{money(allocated - total)}</td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-full border border-grey-300 px-4 py-2 text-sm font-medium text-on-surface hover:bg-grey-50">
              Close
            </button>
            {isManagement ? (
              <button
                type="button"
                disabled={busy || isLoading || entries.length === 0}
                onClick={onApprove}
                className="inline-flex items-center gap-1.5 rounded-full bg-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {approve.isPending ? <Loader2 size={16} className="animate-spin" /> : (
                  <><Check size={16} /> {review?.approved ? "Update final share" : "Approve final share"}</>
                )}
              </button>
            ) : (
              !locked || completeTasks ? (
                <button
                  type="button"
                  disabled={busy || isLoading || isError}
                  onClick={locked ? markCompleted : onSave}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? <Loader2 size={16} className="animate-spin" /> : completeTasks ? "Save & mark tasks completed" : "Save share"}
                </button>
              ) : null
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
