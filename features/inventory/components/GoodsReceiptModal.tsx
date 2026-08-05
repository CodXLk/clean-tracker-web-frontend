"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useCreateGoodsReceipt, type CreateGoodsReceiptInput } from "@/features/inventory/hooks/useGoodsReceipts";
import { fmtQty } from "@/features/inventory/lib/inventory";
import type { PurchaseOrder } from "@/features/inventory/schemas/inventory.schema";

interface GoodsReceiptModalProps {
  open: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
}

type LineDraft = {
  poLineId: string;
  quantity: string;
  batchNumber: string;
  manufactureDate: string;
  expireDate: string;
  unitCost: string;
};

export function GoodsReceiptModal({ open, onClose, purchaseOrder }: GoodsReceiptModalProps) {
  const createMutation = useCreateGoodsReceipt();
  const [note, setNote] = useState("");
  const [drafts, setDrafts] = useState<Record<string, LineDraft>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !purchaseOrder) return;
    const next: Record<string, LineDraft> = {};
    for (const l of purchaseOrder.lines) {
      const remaining = Math.max(0, l.quantity - l.receivedQuantity);
      next[l.id] = {
        poLineId: l.id,
        quantity: remaining > 0 ? String(Number(remaining.toFixed(3))) : "",
        batchNumber: "",
        manufactureDate: "",
        expireDate: "",
        unitCost: l.unitCost != null ? String(l.unitCost) : "",
      };
    }
    setDrafts(next);
    setNote("");
    setError(null);
    createMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, purchaseOrder]);

  if (!purchaseOrder) return null;

  function update(id: string, patch: Partial<LineDraft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const lines = Object.values(drafts)
      .filter((d) => parseFloat(d.quantity) > 0)
      .map((d) => ({
        poLineId: d.poLineId,
        quantity: parseFloat(d.quantity),
        batchNumber: d.batchNumber.trim() || undefined,
        manufactureDate: d.manufactureDate || undefined,
        expireDate: d.expireDate || undefined,
        unitCost: d.unitCost === "" ? undefined : parseFloat(d.unitCost),
      }));

    if (lines.length === 0) return setError("Enter a received quantity for at least one line.");

    const payload: CreateGoodsReceiptInput = {
      purchaseOrderId: purchaseOrder!.id,
      note: note.trim() || undefined,
      lines,
    };
    createMutation.mutate(payload, { onSuccess: onClose });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Receive goods — ${purchaseOrder.poNumber}`}
      description="Record a batch-wise goods receipt against this purchase order."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-3">
          {purchaseOrder.lines.map((l) => {
            const d = drafts[l.id];
            const remaining = Math.max(0, l.quantity - l.receivedQuantity);
            if (!d) return null;
            return (
              <div key={l.id} className="flex flex-col gap-2 rounded-xl border border-grey-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-on-surface">{l.itemName}</span>
                  <span className="text-xs text-grey-500">
                    Remaining {fmtQty(remaining)} {l.unit}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <TextField
                    label="Received qty"
                    type="number"
                    step="0.001"
                    min="0"
                    value={d.quantity}
                    onChange={(e) => update(l.id, { quantity: e.target.value })}
                  />
                  <TextField
                    label="Batch no."
                    placeholder="Optional"
                    value={d.batchNumber}
                    onChange={(e) => update(l.id, { batchNumber: e.target.value })}
                  />
                  <TextField
                    label="Mfg date"
                    type="date"
                    value={d.manufactureDate}
                    onChange={(e) => update(l.id, { manufactureDate: e.target.value })}
                  />
                  <TextField
                    label="Expiry date"
                    type="date"
                    value={d.expireDate}
                    onChange={(e) => update(l.id, { expireDate: e.target.value })}
                  />
                  <TextField
                    label="Unit cost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={d.unitCost}
                    onChange={(e) => update(l.id, { unitCost: e.target.value })}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <TextField label="Note" placeholder="Optional" value={note} onChange={(e) => setNote(e.target.value)} />

        {(error || createMutation.isError) && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {error ?? getErrorMessage(createMutation.error)}
          </p>
        )}

        <div className="mt-1 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-full border border-grey-300 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100"
          >
            Cancel
          </button>
          <PillButton type="submit" variant="teal" className="h-11 flex-1" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Saving…" : "Record GRN"}
          </PillButton>
        </div>
      </form>
    </Modal>
  );
}
