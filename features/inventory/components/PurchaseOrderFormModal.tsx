"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";
import { SearchableSelect } from "@/features/user-management/components/SearchableSelect";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useInventoryItems } from "@/features/inventory/hooks/useInventory";
import { useSuppliers } from "@/features/inventory/hooks/useSuppliers";
import { useCreatePurchaseOrder, type CreatePurchaseOrderInput } from "@/features/inventory/hooks/usePurchaseOrders";
import { fmtMoney } from "@/features/inventory/lib/inventory";

interface PurchaseOrderFormModalProps {
  open: boolean;
  onClose: () => void;
}

type LineDraft = { key: string; itemId: string; quantity: string; unitCost: string };

function newLine(): LineDraft {
  return { key: crypto.randomUUID(), itemId: "", quantity: "", unitCost: "" };
}

export function PurchaseOrderFormModal({ open, onClose }: PurchaseOrderFormModalProps) {
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers(true);
  const { data: items, isLoading: itemsLoading } = useInventoryItems(true);
  const createMutation = useCreatePurchaseOrder();

  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([newLine()]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSupplierId("");
    setExpectedDate("");
    setNote("");
    setLines([newLine()]);
    setError(null);
    createMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function updateLine(key: string, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  const total = lines.reduce((sum, l) => {
    const qty = parseFloat(l.quantity) || 0;
    const cost = parseFloat(l.unitCost) || 0;
    return sum + qty * cost;
  }, 0);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!supplierId) return setError("Select a supplier.");
    const parsed = lines
      .filter((l) => l.itemId && parseFloat(l.quantity) > 0)
      .map((l) => ({
        itemId: l.itemId,
        quantity: parseFloat(l.quantity),
        unitCost: l.unitCost === "" ? undefined : parseFloat(l.unitCost),
      }));
    if (parsed.length === 0) return setError("Add at least one line with an item and quantity.");

    const seen = new Set<string>();
    for (const l of parsed) {
      if (seen.has(l.itemId)) return setError("Each item can appear only once.");
      seen.add(l.itemId);
    }

    const payload: CreatePurchaseOrderInput = {
      supplierId,
      expectedDate: expectedDate || undefined,
      note: note.trim() || undefined,
      lines: parsed,
    };
    createMutation.mutate(payload, { onSuccess: onClose });
  }

  const itemOptions = (items ?? []).map((i) => ({ value: i.id, label: i.name, sublabel: i.unit }));

  return (
    <Modal open={open} onClose={onClose} title="Create purchase order" description="An email is sent to the supplier on creation.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <SearchableSelect
          label="Supplier"
          required
          options={(suppliers ?? []).map((s) => ({ value: s.id, label: s.name, sublabel: s.email ?? undefined }))}
          value={supplierId || null}
          onChange={(v) => setSupplierId(v ?? "")}
          loading={suppliersLoading}
          placeholder="Select supplier"
        />

        <TextField
          label="Expected date"
          type="date"
          value={expectedDate}
          onChange={(e) => setExpectedDate(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-on-surface">Items</span>
          {lines.map((line) => (
            <div key={line.key} className="flex items-end gap-2 rounded-xl border border-grey-200 p-2.5">
              <div className="flex-1">
                <SearchableSelect
                  label="Item"
                  options={itemOptions}
                  value={line.itemId || null}
                  onChange={(v) => updateLine(line.key, { itemId: v ?? "" })}
                  loading={itemsLoading}
                  placeholder="Select item"
                />
              </div>
              <div className="w-20">
                <TextField
                  label="Qty"
                  type="number"
                  step="0.001"
                  min="0"
                  value={line.quantity}
                  onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                />
              </div>
              <div className="w-24">
                <TextField
                  label="Unit cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={line.unitCost}
                  onChange={(e) => updateLine(line.key, { unitCost: e.target.value })}
                />
              </div>
              <button
                type="button"
                aria-label="Remove line"
                onClick={() => setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== line.key) : prev))}
                className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-error/10 hover:text-error"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, newLine()])}
            className="flex items-center gap-1.5 self-start rounded-full border border-grey-300 px-3.5 py-1.5 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100"
          >
            <Plus size={16} aria-hidden="true" /> Add line
          </button>
        </div>

        <TextField label="Note" placeholder="Optional" value={note} onChange={(e) => setNote(e.target.value)} />

        <div className="flex items-center justify-between rounded-xl bg-grey-100 px-3.5 py-2.5 text-sm">
          <span className="font-medium text-on-surface">Estimated total</span>
          <span className="font-semibold text-on-surface">{fmtMoney(total)}</span>
        </div>

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
            {createMutation.isPending ? "Sending…" : "Create & email"}
          </PillButton>
        </div>
      </form>
    </Modal>
  );
}
