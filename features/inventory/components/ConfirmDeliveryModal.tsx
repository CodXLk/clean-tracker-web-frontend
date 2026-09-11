"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useConfirmDelivery, useApproveReceipt } from "@/features/inventory/hooks/useInventory";
import { fmtQty } from "@/features/inventory/lib/inventory";
import type { InventoryDelivery } from "@/features/inventory/schemas/inventory.schema";

interface ConfirmDeliveryModalProps {
  open: boolean;
  onClose: () => void;
  delivery: InventoryDelivery | null;
  /** "approve" reviews a discrepant delivery (management); defaults to the site's own confirmation. */
  mode?: "confirm" | "approve";
}

interface LineState {
  confirmed: string;
  minStock: string;
}

export function ConfirmDeliveryModal({ open, onClose, delivery, mode = "confirm" }: ConfirmDeliveryModalProps) {
  const confirmMutation = useConfirmDelivery();
  const approveMutation = useApproveReceipt();
  const mutation = mode === "approve" ? approveMutation : confirmMutation;
  const [state, setState] = useState<Record<string, LineState>>({});
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open && delivery) {
      const init: Record<string, LineState> = {};
      for (const l of delivery.lines) {
        // Approval starts from what the site reported received; confirmation starts from what was sent.
        const start = mode === "approve" && l.confirmedQuantity != null ? l.confirmedQuantity : l.expectedQuantity;
        init[l.id] = {
          confirmed: String(start),
          minStock: l.minStock != null ? String(l.minStock) : "",
        };
      }
      setState(init);
      setNote(delivery.note ?? "");
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, delivery, mode]);

  if (!delivery) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const lines = delivery!.lines.map((l) => ({
      lineId: l.id,
      confirmedQuantity: parseFloat(state[l.id]?.confirmed ?? "0") || 0,
      minStock: state[l.id]?.minStock === "" ? undefined : parseFloat(state[l.id]!.minStock),
    }));
    mutation.mutate({ id: delivery!.id, note: note.trim() || undefined, lines }, { onSuccess: onClose });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${mode === "approve" ? "Approve receipt" : "Confirm delivery"} — ${delivery.siteName}`}
      description={mode === "approve"
        ? "The received quantities differ from what was sent. Adjust if needed, then approve to receive."
        : "Confirm what actually arrived. Adjust quantities or minimum stock if they differ from what was dispatched."}
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_90px_90px] items-center gap-2 text-xs font-medium text-grey-500">
            <span>Item (dispatched)</span>
            <span>Received</span>
            <span>Min stock</span>
          </div>
          {delivery.lines.map((l) => (
            <div key={l.id} className="grid grid-cols-[1fr_90px_90px] items-center gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-on-surface">{l.itemName}</p>
                <p className="text-xs text-grey-500">{fmtQty(l.expectedQuantity)} {l.unit} sent</p>
              </div>
              <input
                type="number" min="0" step="0.001" aria-label={`Received ${l.itemName}`}
                value={state[l.id]?.confirmed ?? ""}
                onChange={(e) => setState((p) => ({ ...p, [l.id]: { ...p[l.id]!, confirmed: e.target.value } }))}
                className="h-11 w-full rounded-xl border border-grey-300 bg-white px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="number" min="0" step="0.001" placeholder="—" aria-label={`Minimum ${l.itemName}`}
                value={state[l.id]?.minStock ?? ""}
                onChange={(e) => setState((p) => ({ ...p, [l.id]: { ...p[l.id]!, minStock: e.target.value } }))}
                className="h-11 w-full rounded-xl border border-grey-300 bg-white px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          ))}
        </div>

        <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />

        {mutation.isError && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {getErrorMessage(mutation.error)}
          </p>
        )}

        <div className="mt-1 flex gap-3">
          <button
            type="button" onClick={onClose}
            className="h-11 flex-1 rounded-full border border-grey-300 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100"
          >
            Cancel
          </button>
          <PillButton type="submit" variant="teal" className="h-11 flex-1" disabled={mutation.isPending}>
            {mutation.isPending
              ? mode === "approve" ? "Approving…" : "Confirming…"
              : mode === "approve" ? "Approve & receive" : "Confirm receipt"}
          </PillButton>
        </div>
      </form>
    </Modal>
  );
}
