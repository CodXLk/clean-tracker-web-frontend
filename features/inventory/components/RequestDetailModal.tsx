"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, X, Pencil, Plus, Trash2, History } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { SearchableSelect } from "@/features/user-management/components/SearchableSelect";
import { StatusBadge } from "./StatusBadge";
import { AuditLogModal } from "./AuditLogModal";
import {
  useRequestAction,
  useSiteInventory,
  useCleanerInventory,
  useInventoryItems,
} from "@/features/inventory/hooks/useInventory";
import { fmtQty, fmtDateTime } from "@/features/inventory/lib/inventory";
import type { InventoryRequest } from "@/features/inventory/schemas/inventory.schema";

interface RequestDetailModalProps {
  open: boolean;
  onClose: () => void;
  request: InventoryRequest | null;
  canManage: boolean;
}

type EditLine = { key: string; itemId: string; itemName: string; unit: string; quantity: string };

/** Read-only request detail: requested items on top, current target inventory below, with review actions. */
export function RequestDetailModal({ open, onClose, request, canManage }: RequestDetailModalProps) {
  const action = useRequestAction();
  const { data: items } = useInventoryItems(true);
  const isCleaner = request?.requestType === "CLEANER";

  const siteInv = useSiteInventory(!isCleaner ? request?.siteId : undefined);
  const cleanerInv = useCleanerInventory(isCleaner ? request?.targetCleanerId ?? undefined : undefined);

  const [editMode, setEditMode] = useState(false);
  const [editLines, setEditLines] = useState<EditLine[]>([]);
  const [auditOpen, setAuditOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEditMode(false);
    setEditLines(
      (request?.lines ?? []).map((l) => ({
        key: crypto.randomUUID(),
        itemId: l.itemId,
        itemName: l.itemName,
        unit: l.unit,
        quantity: String(l.requestedQuantity),
      })),
    );
    action.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, request]);

  const itemOptions = useMemo(
    () => (items ?? []).map((i) => ({ value: i.id, label: i.name, sublabel: i.unit })),
    [items],
  );

  const currentRows = isCleaner
    ? (cleanerInv.data?.items ?? []).map((i) => ({ itemName: i.itemName, unit: i.unit, quantity: i.quantity }))
    : (siteInv.data ?? []).map((i) => ({ itemName: i.itemName, unit: i.unit, quantity: i.quantity }));
  const currentLoading = isCleaner ? cleanerInv.isLoading : siteInv.isLoading;

  if (!request) return null;

  function updateEdit(key: string, patch: Partial<EditLine>) {
    setEditLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function addEditLine() {
    setEditLines((prev) => [...prev, { key: crypto.randomUUID(), itemId: "", itemName: "", unit: "", quantity: "" }]);
  }
  function setEditItem(key: string, itemId: string) {
    const item = (items ?? []).find((i) => i.id === itemId);
    updateEdit(key, { itemId, itemName: item?.name ?? "", unit: item?.unit ?? "" });
  }

  function run(kind: "approve" | "reject") {
    if (!request) return;
    let lines: { itemId: string; quantity: number }[] | undefined;
    if (kind === "approve" && editMode) {
      lines = editLines
        .filter((l) => l.itemId && parseFloat(l.quantity) > 0)
        .map((l) => ({ itemId: l.itemId, quantity: parseFloat(l.quantity) }));
      if (lines.length === 0) return;
    }
    action.mutate({ id: request.id, action: kind, lines }, { onSuccess: onClose });
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
          <button
            type="button"
            onClick={() => setAuditOpen(true)}
            className="ml-auto flex items-center gap-1.5 rounded-full border border-grey-300 px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-grey-100"
          >
            <History size={13} aria-hidden="true" /> Audit log
          </button>
        </div>

        {/* Requested items */}
        <section>
          <h3 className="mb-2 text-sm font-semibold text-on-surface">Requested items</h3>
          {editMode ? (
            <div className="flex flex-col gap-2">
              {editLines.map((line) => (
                <div key={line.key} className="flex items-end gap-2 rounded-xl border border-grey-200 p-2.5">
                  <div className="flex-1">
                    <SearchableSelect
                      label="Item"
                      options={itemOptions}
                      value={line.itemId || null}
                      onChange={(v) => setEditItem(line.key, v ?? "")}
                      placeholder="Select item"
                    />
                  </div>
                  <div className="w-24">
                    <TextField
                      label="Qty"
                      type="number"
                      step="0.001"
                      min="0"
                      value={line.quantity}
                      onChange={(e) => updateEdit(line.key, { quantity: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label="Remove line"
                    onClick={() => setEditLines((prev) => prev.filter((l) => l.key !== line.key))}
                    className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-error/10 hover:text-error"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addEditLine}
                className="flex items-center gap-1.5 self-start rounded-full border border-grey-300 px-3.5 py-1.5 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100"
              >
                <Plus size={16} aria-hidden="true" /> Add item
              </button>
            </div>
          ) : (
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
          )}
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
              onClick={() => setEditMode((v) => !v)}
              disabled={action.isPending}
              className="mr-auto flex items-center gap-1.5 rounded-full border border-grey-300 px-5 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-60"
            >
              <Pencil size={15} aria-hidden="true" /> {editMode ? "Done editing" : "Edit items"}
            </button>
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

      <AuditLogModal
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        refType="REQUEST"
        refId={request.id}
        title="Request audit log"
      />
    </Modal>
  );
}
