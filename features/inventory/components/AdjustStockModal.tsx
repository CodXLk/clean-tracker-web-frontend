"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useAdjustMainStock } from "@/features/inventory/hooks/useInventory";
import { fmtQty } from "@/features/inventory/lib/inventory";
import type { InventoryItem } from "@/features/inventory/schemas/inventory.schema";

interface AdjustStockModalProps {
  open: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

export function AdjustStockModal({ open, onClose, item }: AdjustStockModalProps) {
  const mutation = useAdjustMainStock();
  const [mode, setMode] = useState<"ADD" | "SET">("ADD");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setMode("ADD");
      setQuantity("");
      setNote("");
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!item) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (Number.isNaN(qty)) return;
    mutation.mutate({ id: item!.id, quantity: qty, mode, note: note.trim() || undefined }, { onSuccess: onClose });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Adjust stock — ${item.name}`}
      description={`Current main-warehouse stock: ${fmtQty(item.mainStockQuantity)} ${item.unit}`}
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div className="inline-flex overflow-hidden rounded-xl border border-grey-300">
          {(["ADD", "SET"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                mode === m ? "bg-primary text-white" : "bg-white text-on-surface hover:bg-grey-100"
              }`}
            >
              {m === "ADD" ? "Add stock" : "Set balance"}
            </button>
          ))}
        </div>

        <TextField
          label={mode === "ADD" ? `Quantity to add (${item.unit})` : `New balance (${item.unit})`}
          type="number"
          step="0.001"
          min="0"
          required
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />

        {mutation.isError && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {getErrorMessage(mutation.error)}
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
          <PillButton type="submit" variant="teal" className="h-11 flex-1" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Update stock"}
          </PillButton>
        </div>
      </form>
    </Modal>
  );
}
