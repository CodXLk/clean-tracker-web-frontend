"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { PillButton } from "@/components/shared/PillButton";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useClientDispatch } from "@/features/inventory/hooks/usePurchaseOrders";
import type { PurchaseOrder } from "@/features/inventory/schemas/inventory.schema";

interface ClientDispatchModalProps {
  open: boolean;
  onClose: () => void;
  request: PurchaseOrder | null;
}

/** Hotel client reviews a request and dispatches items (quantities adjustable) to its site. */
export function ClientDispatchModal({ open, onClose, request }: ClientDispatchModalProps) {
  const dispatch = useClientDispatch();
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open || !request) return;
    const initial: Record<string, string> = {};
    for (const line of request.lines) initial[line.itemId] = String(line.quantity);
    setQuantities(initial);
    setNote("");
    dispatch.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, request]);

  if (!request) return null;

  function submit() {
    if (!request) return;
    const lines = request.lines
      .map((line) => ({ itemId: line.itemId, quantity: Number(quantities[line.itemId] ?? line.quantity) }))
      .filter((l) => Number.isFinite(l.quantity) && l.quantity > 0);
    if (lines.length === 0) return;
    dispatch.mutate(
      { id: request.id, input: { note: note.trim() || undefined, lines } },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={`Dispatch items — ${request.poNumber}`}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-grey-500">
          Dispatching to <span className="font-medium text-on-surface">{request.siteName}</span>. Adjust
          the quantities you are actually sending, then confirm — the site will approve what they receive.
        </p>

        <div className="flex flex-col gap-2">
          {request.lines.map((line) => (
            <div key={line.itemId} className="flex items-center gap-3 rounded-xl border border-grey-200 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-on-surface">{line.itemName}</p>
                <p className="text-xs text-grey-500">Requested: {line.quantity} {line.unit}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={quantities[line.itemId] ?? ""}
                  onChange={(e) => setQuantities((q) => ({ ...q, [line.itemId]: e.target.value }))}
                  className="w-24 rounded-lg border border-grey-300 px-2.5 py-1.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-xs text-grey-500">{line.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="dispatch-note" className="text-sm font-medium text-on-surface">
            Note (optional)
          </label>
          <textarea
            id="dispatch-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="resize-none rounded-xl border border-grey-300 px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {dispatch.isError && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {getErrorMessage(dispatch.error)}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-full border border-grey-300 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100"
          >
            Cancel
          </button>
          <PillButton type="button" variant="teal" className="h-11 flex-1" disabled={dispatch.isPending} onClick={submit}>
            {dispatch.isPending ? "Dispatching…" : "Confirm & dispatch"}
          </PillButton>
        </div>
      </div>
    </Modal>
  );
}
