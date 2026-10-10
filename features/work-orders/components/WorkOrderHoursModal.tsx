"use client";

import { useMemo, useState } from "react";
import { X, Loader2, Check } from "lucide-react";
import { ModalPortal } from "@/components/shared/ModalPortal";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useMe } from "@/features/auth/hooks/useMe";
import {
  useApproveHours,
  useSaveSupervisorHours,
  useWorkOrderHours,
} from "@/features/work-orders/hooks/useWorkOrderHours";
import type { WorkOrderHourEntry } from "@/features/work-orders/schemas/workOrderHours.schema";

const MANAGEMENT_ROLES = new Set(["SUPER_ADMIN", "COMPANY_ADMIN", "CLIENT_SERVICE_MANAGER"]);

function num(v: number | null | undefined): number {
  return typeof v === "number" ? v : 0;
}

function money(v: number): string {
  return v.toLocaleString(undefined, { style: "currency", currency: "AUD" });
}

export function WorkOrderHoursModal({
  workOrderId,
  poId,
  onClose,
}: {
  workOrderId: string;
  poId?: string | null;
  onClose: () => void;
}) {
  const isManagement = MANAGEMENT_ROLES.has(useMe().data?.role ?? "");
  const { data: review, isLoading } = useWorkOrderHours(workOrderId);
  const saveSupervisor = useSaveSupervisorHours();
  const approve = useApproveHours();
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const perHour = review?.mode === "RATE_PER_HOUR";
  const rate = num(review?.rate);

  // The value in the tier this user edits (admin for management, else supervisor), falling back
  // down the tiers so the input starts from the latest known value.
  function editValue(e: WorkOrderHourEntry): number {
    if (edits[e.id] !== undefined) return Number(edits[e.id]) || 0;
    if (perHour) {
      const tier = isManagement ? e.adminHours : e.supervisorHours;
      return num(tier ?? e.supervisorHours ?? e.systemHours);
    }
    const tier = isManagement ? e.adminAmount : e.supervisorAmount;
    return num(tier ?? e.supervisorAmount ?? e.systemAmount);
  }

  const totals = useMemo(() => {
    let hours = 0;
    let amount = 0;
    for (const e of review?.entries ?? []) {
      const v = editValue(e);
      if (perHour) {
        hours += v;
        amount += v * rate;
      } else {
        amount += v;
      }
    }
    return { hours, amount };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review?.entries, edits, perHour, rate, isManagement]);

  function setEdit(id: string, value: string) {
    setEdits((p) => ({ ...p, [id]: value }));
  }

  function buildPayload() {
    return (review?.entries ?? []).map((e) => {
      const v = editValue(e);
      return perHour ? { id: e.id, hours: v } : { id: e.id, amount: v };
    });
  }

  function onSave() {
    setError(null);
    saveSupervisor.mutate(
      { workOrderId, entries: buildPayload() },
      { onSuccess: () => setEdits({}), onError: (e) => setError(getErrorMessage(e)) },
    );
  }

  function onApprove() {
    setError(null);
    approve.mutate(
      { workOrderId, entries: buildPayload() },
      { onSuccess: () => onClose(), onError: (e) => setError(getErrorMessage(e)) },
    );
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
        <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white p-5 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-on-surface">Worked hours review</h2>
              <p className="text-xs text-grey-500">
                {poId ? `PO ${poId} · ` : ""}
                {perHour ? `Rate ${money(rate)}/hr` : "Allocated amount"}
                {review?.approved ? " · Approved" : ""}
              </p>
            </div>
            <button type="button" aria-label="Close" onClick={onClose} className="rounded-full p-1 text-grey-400 hover:bg-grey-100">
              <X size={18} />
            </button>
          </div>

          {error && <p role="alert" className="mb-3 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}

          {isLoading ? (
            <div className="flex justify-center py-10 text-grey-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (review?.entries.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-grey-500">No hours recorded for this work order yet.</p>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-grey-200 text-left text-xs text-grey-500">
                    <th className="py-2 pr-2">Cleaner</th>
                    {perHour && <th className="py-2 pr-2">Date</th>}
                    <th className="py-2 pr-2 text-right">System</th>
                    <th className="py-2 pr-2 text-right">Supervisor</th>
                    {isManagement && <th className="py-2 pr-2 text-right">Final</th>}
                    {perHour && <th className="py-2 text-right">Amount</th>}
                  </tr>
                </thead>
                <tbody>
                  {(review?.entries ?? []).map((e) => {
                    const sys = perHour ? e.systemHours : e.systemAmount;
                    const sup = perHour ? e.supervisorHours : e.supervisorAmount;
                    const current = editValue(e);
                    return (
                      <tr key={e.id} className="border-b border-grey-100">
                        <td className="py-2 pr-2 font-medium text-on-surface">{e.cleanerName}</td>
                        {perHour && <td className="py-2 pr-2 text-grey-600">{e.entryDate ?? "—"}</td>}
                        <td className="py-2 pr-2 text-right text-grey-500">{sys == null ? "—" : sys}</td>
                        <td className="py-2 pr-2 text-right">
                          {isManagement ? (
                            <span className="text-grey-600">{sup == null ? "—" : sup}</span>
                          ) : (
                            <input
                              type="number"
                              min={0}
                              step="0.25"
                              value={edits[e.id] ?? String(current)}
                              onChange={(ev) => setEdit(e.id, ev.target.value)}
                              className="h-8 w-20 rounded-lg border border-grey-300 px-2 text-right text-sm outline-none focus:border-primary"
                            />
                          )}
                        </td>
                        {isManagement && (
                          <td className="py-2 pr-2 text-right">
                            <input
                              type="number"
                              min={0}
                              step="0.25"
                              value={edits[e.id] ?? String(current)}
                              onChange={(ev) => setEdit(e.id, ev.target.value)}
                              className="h-8 w-20 rounded-lg border border-grey-300 px-2 text-right text-sm outline-none focus:border-primary"
                            />
                          </td>
                        )}
                        {perHour && <td className="py-2 text-right text-grey-700">{money(current * rate)}</td>}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="font-semibold text-on-surface">
                    <td className="py-2 pr-2" colSpan={perHour ? 2 : 1}>Total</td>
                    <td className="py-2 pr-2" />
                    <td className="py-2 pr-2" />
                    {isManagement && <td className="py-2 pr-2" />}
                    <td className="py-2 text-right">
                      {perHour ? `${totals.hours.toFixed(2)}h · ${money(totals.amount)}` : money(totals.amount)}
                    </td>
                  </tr>
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
                disabled={approve.isPending || review?.approved}
                onClick={onApprove}
                className="inline-flex items-center gap-1.5 rounded-full bg-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {approve.isPending ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Approve final</>}
              </button>
            ) : (
              <button
                type="button"
                disabled={saveSupervisor.isPending}
                onClick={onSave}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {saveSupervisor.isPending ? <Loader2 size={16} className="animate-spin" /> : "Save"}
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
