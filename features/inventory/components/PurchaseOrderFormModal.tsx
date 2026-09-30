"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";
import { SearchableSelect } from "@/features/user-management/components/SearchableSelect";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useInventoryItems } from "@/features/inventory/hooks/useInventory";
import { useSuppliers } from "@/features/inventory/hooks/useSuppliers";
import { useCreatePurchaseOrder, type CreatePurchaseOrderInput } from "@/features/inventory/hooks/usePurchaseOrders";
import {
  useSavePurchaseOrderDraft,
  useDeletePurchaseOrderDraft,
  type PurchaseOrderDraft,
} from "@/features/inventory/hooks/usePurchaseOrderDrafts";

interface PurchaseOrderFormModalProps {
  open: boolean;
  onClose: () => void;
  draft?: PurchaseOrderDraft | null;
}

type LineDraft = { key: string; itemId: string; quantity: string };

function newLine(): LineDraft {
  return { key: crypto.randomUUID(), itemId: "", quantity: "" };
}

type PoPayload = {
  supplierId?: string;
  expectedDate?: string;
  deliveryAddress?: string;
  note?: string;
  lines?: { itemId: string; quantity: string }[];
};

export function PurchaseOrderFormModal({ open, onClose, draft }: PurchaseOrderFormModalProps) {
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers(true);
  const { data: items, isLoading: itemsLoading } = useInventoryItems(true);
  const createMutation = useCreatePurchaseOrder();
  const saveDraft = useSavePurchaseOrderDraft();
  const deleteDraft = useDeletePurchaseOrderDraft();

  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([newLine()]);
  const [error, setError] = useState<string | null>(null);
  // Prevents the close handler from auto-saving a draft after an explicit submit/save.
  const skipAutosave = useRef(false);

  useEffect(() => {
    if (!open) return;
    skipAutosave.current = false;
    const p = (draft?.payload ?? {}) as PoPayload;
    setSupplierId(p.supplierId ?? "");
    setExpectedDate(p.expectedDate ?? "");
    setDeliveryAddress(p.deliveryAddress ?? "");
    setNote(p.note ?? "");
    setLines(
      p.lines && p.lines.length > 0
        ? p.lines.map((l) => ({ key: crypto.randomUUID(), itemId: l.itemId, quantity: l.quantity }))
        : [newLine()],
    );
    setError(null);
    createMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draft]);

  // Suppliers we can send POs to (hotel self-supplying clients receive item requests, not POs).
  const poSuppliers = (suppliers ?? []).filter((s) => !s.clientSelfSupplying);
  const selfSupplyIds = new Set((suppliers ?? []).filter((s) => s.clientSelfSupplying).map((s) => s.id));
  const poItems = (items ?? []).filter((i) => !i.supplierId || !selfSupplyIds.has(i.supplierId));
  const itemOptions = poItems.map((i) => ({ value: i.id, label: i.name, sublabel: i.unit }));

  function updateLine(key: string, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function hasContent() {
    return !!supplierId || lines.some((l) => l.itemId || l.quantity);
  }

  function currentPayload(): PoPayload {
    return {
      supplierId: supplierId || undefined,
      expectedDate: expectedDate || undefined,
      deliveryAddress: deliveryAddress || undefined,
      note: note.trim() || undefined,
      lines: lines.filter((l) => l.itemId).map((l) => ({ itemId: l.itemId, quantity: l.quantity })),
    };
  }

  function draftTitle() {
    const supplier = poSuppliers.find((s) => s.id === supplierId);
    return supplier ? `PO · ${supplier.name}` : "Draft purchase order";
  }

  function parseLines() {
    return lines
      .filter((l) => l.itemId && parseFloat(l.quantity) > 0)
      .map((l) => ({ itemId: l.itemId, quantity: parseFloat(l.quantity) }));
  }

  function handleSaveDraft() {
    skipAutosave.current = true;
    saveDraft.mutate(
      { id: draft?.id, input: { title: draftTitle(), supplierId: supplierId || undefined, payload: currentPayload() } },
      { onSuccess: onClose },
    );
  }

  function handleClose() {
    // Autosave in-progress work as a draft when closing without an explicit action.
    if (!skipAutosave.current && hasContent()) {
      saveDraft.mutate({
        id: draft?.id,
        input: { title: draftTitle(), supplierId: supplierId || undefined, payload: currentPayload() },
      });
    }
    onClose();
  }

  function submit() {
    setError(null);
    if (!supplierId) return setError("Select a supplier.");
    const parsed = parseLines();
    if (parsed.length === 0) return setError("Add at least one line with an item and quantity.");
    const seen = new Set<string>();
    for (const l of parsed) {
      if (seen.has(l.itemId)) return setError("Each item can appear only once.");
      seen.add(l.itemId);
    }
    const payload: CreatePurchaseOrderInput = {
      supplierId,
      expectedDate: expectedDate || undefined,
      deliveryAddress: deliveryAddress.trim() || undefined,
      note: note.trim() || undefined,
      draft: false,
      lines: parsed,
    };
    skipAutosave.current = true;
    createMutation.mutate(payload, {
      onSuccess: () => {
        if (draft?.id) deleteDraft.mutate(draft.id);
        onClose();
      },
    });
  }

  const busy = createMutation.isPending || saveDraft.isPending;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={draft ? "Resume purchase order" : "Create purchase order"}
      description="Emails the supplier when created. Close to keep it as a draft."
    >
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-col gap-4" noValidate>
        <SearchableSelect
          label="Supplier"
          required
          options={poSuppliers.map((s) => ({ value: s.id, label: s.name, sublabel: s.email ?? undefined }))}
          value={supplierId || null}
          onChange={(v) => setSupplierId(v ?? "")}
          loading={suppliersLoading}
          placeholder="Select supplier"
        />

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Expected date"
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
          />
          <TextField
            label="Delivery address"
            placeholder="Where to deliver"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
          />
        </div>

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
              <div className="w-24">
                <TextField
                  label="Qty"
                  type="number"
                  step="0.001"
                  min="0"
                  value={line.quantity}
                  onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
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

        <TextField label="Note" placeholder="Optional — included in the supplier email" value={note} onChange={(e) => setNote(e.target.value)} />

        {(error || createMutation.isError || saveDraft.isError) && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {error ?? getErrorMessage(createMutation.error ?? saveDraft.error)}
          </p>
        )}

        <div className="mt-1 flex gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={busy || !hasContent()}
            className="h-11 flex-1 rounded-full border border-grey-300 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-50"
          >
            {saveDraft.isPending ? "Saving…" : "Save draft"}
          </button>
          <PillButton type="submit" variant="teal" className="h-11 flex-1" disabled={busy}>
            {createMutation.isPending ? "Sending…" : "Create & email"}
          </PillButton>
        </div>
      </form>
    </Modal>
  );
}
