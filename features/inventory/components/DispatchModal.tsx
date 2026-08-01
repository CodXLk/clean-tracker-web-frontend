"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useInventoryItems, useDispatchDelivery } from "@/features/inventory/hooks/useInventory";
import type { InventoryRequest } from "@/features/inventory/schemas/inventory.schema";
import { fmtQty } from "@/features/inventory/lib/inventory";

interface DispatchModalProps {
  open: boolean;
  onClose: () => void;
  /** When set, dispatch fulfils this approved request (site + items prefilled). */
  request?: InventoryRequest | null;
}

interface Line {
  itemId: string;
  expected: string;
  minStock: string;
}

export function DispatchModal({ open, onClose, request }: DispatchModalProps) {
  const sitesQuery = useSites();
  const itemsQuery = useInventoryItems(true);
  const dispatchMutation = useDispatchDelivery();

  const [siteId, setSiteId] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Line[]>([{ itemId: "", expected: "", minStock: "" }]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (request) {
      setSiteId(request.siteId);
      setLines(request.lines.map((l) => ({
        itemId: l.itemId,
        expected: String(l.requestedQuantity),
        minStock: "",
      })));
    } else {
      setSiteId("");
      setLines([{ itemId: "", expected: "", minStock: "" }]);
    }
    setNote("");
    setError(null);
    dispatchMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, request]);

  const siteOptions: SelectOption[] = useMemo(
    () => (sitesQuery.data ?? []).map((s) => ({ value: s.id, label: s.name })),
    [sitesQuery.data],
  );
  const itemsById = useMemo(
    () => new Map((itemsQuery.data ?? []).map((i) => [i.id, i])),
    [itemsQuery.data],
  );
  const itemOptions: SelectOption[] = useMemo(
    () => (itemsQuery.data ?? []).map((i) => ({
      value: i.id,
      label: `${i.name} (${i.unit})`,
      sublabel: `${fmtQty(i.mainStockQuantity)} in warehouse`,
    })),
    [itemsQuery.data],
  );

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!siteId) return setError("Select a site.");
    const cleaned = lines
      .filter((l) => l.itemId && parseFloat(l.expected) > 0)
      .map((l) => ({
        itemId: l.itemId,
        expectedQuantity: parseFloat(l.expected),
        minStock: l.minStock === "" ? undefined : parseFloat(l.minStock),
      }));
    if (cleaned.length === 0) return setError("Add at least one item with a quantity.");
    // Guard against dispatching more than the warehouse holds (backend also enforces).
    for (const l of cleaned) {
      const item = itemsById.get(l.itemId);
      if (item && l.expectedQuantity > item.mainStockQuantity) {
        return setError(`Only ${fmtQty(item.mainStockQuantity)} ${item.unit} of ${item.name} in the warehouse.`);
      }
    }
    dispatchMutation.mutate(
      { siteId, requestId: request?.id, note: note.trim() || undefined, lines: cleaned },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Dispatch to site"
      description="Send stock from the main warehouse. Set a minimum stock to enable low-stock alerts at the site."
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <SearchableSelect
          label="Site"
          required
          options={siteOptions}
          value={siteId || null}
          onChange={setSiteId}
          disabled={!!request}
          loading={sitesQuery.isLoading}
          placeholder="Select a site"
        />

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_80px_80px_36px] items-center gap-2 text-xs font-medium text-grey-500">
            <span>Item</span>
            <span>Qty</span>
            <span>Min</span>
            <span />
          </div>
          {lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_80px_80px_36px] items-center gap-2">
              <SearchableSelect
                label=""
                options={itemOptions}
                value={line.itemId || null}
                onChange={(v) => updateLine(idx, { itemId: v })}
                loading={itemsQuery.isLoading}
                placeholder="Item"
              />
              <input
                type="number" min="0" step="0.001" placeholder="Qty" value={line.expected}
                onChange={(e) => updateLine(idx, { expected: e.target.value })} aria-label="Quantity"
                className="h-11 w-full rounded-xl border border-grey-300 bg-white px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="number" min="0" step="0.001" placeholder="Min" value={line.minStock}
                onChange={(e) => updateLine(idx, { minStock: e.target.value })} aria-label="Minimum stock"
                className="h-11 w-full rounded-xl border border-grey-300 bg-white px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {lines.length > 1 ? (
                <button
                  type="button" aria-label="Remove line"
                  onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                  className="flex h-11 w-9 items-center justify-center rounded-lg text-grey-500 hover:bg-red-50 hover:text-danger"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              ) : <span />}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, { itemId: "", expected: "", minStock: "" }])}
            className="mt-1 flex items-center gap-1.5 self-start rounded-lg border border-dashed border-grey-300 px-3 py-1.5 text-xs font-medium text-grey-500 hover:border-primary hover:text-primary"
          >
            <Plus size={14} aria-hidden="true" />
            Add item
          </button>
        </div>

        <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />

        {(error || dispatchMutation.isError) && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {error ?? getErrorMessage(dispatchMutation.error)}
          </p>
        )}

        <div className="mt-1 flex gap-3">
          <button
            type="button" onClick={onClose}
            className="h-11 flex-1 rounded-full border border-grey-300 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100"
          >
            Cancel
          </button>
          <PillButton type="submit" variant="teal" className="h-11 flex-1" disabled={dispatchMutation.isPending}>
            {dispatchMutation.isPending ? "Dispatching…" : "Dispatch"}
          </PillButton>
        </div>
      </form>
    </Modal>
  );
}
