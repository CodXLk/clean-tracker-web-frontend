"use client";

import { Check, X } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { StatusBadge } from "./StatusBadge";
import {
  useRequestAction,
  useSiteInventory,
  useCleanerInventory,
} from "@/features/inventory/hooks/useInventory";
import { fmtQty, fmtDateTime } from "@/features/inventory/lib/inventory";
import type { InventoryRequest } from "@/features/inventory/schemas/inventory.schema";

interface RequestDetailModalProps {
  open: boolean;
  onClose: () => void;
  request: InventoryRequest | null;
  canManage: boolean;
}

/** Read-only request detail: requested items on top, current target inventory below, with review actions. */
export function RequestDetailModal({ open, onClose, request, canManage }: RequestDetailModalProps) {
  const action = useRequestAction();
  const isCleaner = request?.requestType === "CLEANER";

  const siteInv = useSiteInventory(!isCleaner ? request?.siteId : undefined);
  const cleanerInv = useCleanerInventory(isCleaner ? request?.targetCleanerId ?? undefined : undefined);

  const currentRows = isCleaner
    ? (cleanerInv.data?.items ?? []).map((i) => ({ itemName: i.itemName, unit: i.unit, quantity: i.quantity }))
    : (siteInv.data ?? []).map((i) => ({ itemName: i.itemName, unit: i.unit, quantity: i.quantity }));
  const currentLoading = isCleaner ? cleanerInv.isLoading : siteInv.isLoading;

  if (!request) return null;

  function run(kind: "approve" | "reject") {
    if (!request) return;
    action.mutate({ id: request.id, action: kind }, { onSuccess: onClose });
  }

  const currentTitle = isCleaner
    ? `Current cleaner inventory${request.targetCleanerName ? ` · ${request.targetCleanerName}` : ""}`
    : `Current site inventory · ${request.siteName}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Request · ${request.siteName}`}
      description={`${isCleaner ? "Issue to cleaner" : "Site restock"} · by ${request.requestedByName ?? "Unknown"} · ${fmtDateTime(request.createdAt)}`}
      maxWidthClassName="max-w-2xl"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={request.status} />
          {isCleaner && request.targetCleanerName && (
            <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-medium text-secondary">
              To: {request.targetCleanerName}
            </span>
          )}
          {request.note && <span className="text-xs text-grey-500">“{request.note}”</span>}
        </div>

        {/* Requested items */}
        <section>
          <h3 className="mb-2 text-sm font-semibold text-on-surface">Requested items</h3>
          <div className="overflow-hidden rounded-xl border border-grey-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-grey-50 text-xs uppercase tracking-wide text-grey-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Item</th>
                  <th className="px-4 py-2 text-right font-medium">Requested</th>
                </tr>
              </thead>
              <tbody>
                {request.lines.map((l) => (
                  <tr key={l.itemId} className="border-t border-grey-100">
                    <td className="px-4 py-2 text-on-surface">{l.itemName}</td>
                    <td className="px-4 py-2 text-right font-medium text-on-surface">
                      {fmtQty(l.requestedQuantity)} {l.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Current inventory for the target */}
        <section>
          <h3 className="mb-2 text-sm font-semibold text-on-surface">{currentTitle}</h3>
          {currentLoading ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner size={22} />
            </div>
          ) : currentRows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-grey-200 px-4 py-4 text-center text-xs text-grey-500">
              No items currently held.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-grey-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-grey-50 text-xs uppercase tracking-wide text-grey-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Item</th>
                    <th className="px-4 py-2 text-right font-medium">On hand</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((r) => (
                    <tr key={r.itemName} className="border-t border-grey-100">
                      <td className="px-4 py-2 text-on-surface">{r.itemName}</td>
                      <td className="px-4 py-2 text-right text-grey-700">
                        {fmtQty(r.quantity)} {r.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {request.reviewedByName && (
          <p className="text-xs text-grey-400">
            Reviewed by {request.reviewedByName} · {fmtDateTime(request.reviewedAt)}
            {request.reviewNote ? ` · “${request.reviewNote}”` : ""}
          </p>
        )}

        {action.isError && <p className="text-sm font-medium text-error">Action failed. Please try again.</p>}

        {/* Floating footer actions */}
        {canManage && request.status === "PENDING" && (
          <div className="sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-2 border-t border-grey-200 bg-white px-6 py-4">
            <button
              type="button"
              onClick={() => run("reject")}
              disabled={action.isPending}
              className="flex items-center gap-1.5 rounded-full border border-grey-300 px-5 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-red-50 hover:text-danger disabled:opacity-60"
            >
              <X size={15} aria-hidden="true" /> Reject
            </button>
            <button
              type="button"
              onClick={() => run("approve")}
              disabled={action.isPending}
              className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <Check size={15} aria-hidden="true" /> Approve
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
