"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useCleaners } from "@/features/cleaners/hooks/useCleaners";
import {
  useInventoryItems,
  useCreateRequest,
  useSiteInventory,
  useCleanerInventory,
} from "@/features/inventory/hooks/useInventory";
import {
  REQUEST_TYPE_LABELS,
  REQUEST_SOURCE_LABELS,
  type RequestType,
  type RequestSource,
} from "@/features/inventory/schemas/inventory.schema";

interface RequestFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Lock the site (e.g. when raised from a site context). */
  fixedSiteId?: string;
  /** Management skips the confirm-current-inventory step; others must confirm first. */
  canManage?: boolean;
}

interface Line {
  itemId: string;
  quantity: string;
}

export function RequestFormModal({ open, onClose, fixedSiteId, canManage = true }: RequestFormModalProps) {
  const sitesQuery = useSites();
  const itemsQuery = useInventoryItems(true);
  const cleanersQuery = useCleaners();
  const createMutation = useCreateRequest();

  const [siteId, setSiteId] = useState(fixedSiteId ?? "");
  const [requestType, setRequestType] = useState<RequestType>("SITE");
  const [source, setSource] = useState<RequestSource>("WAREHOUSE");
  const [cleanerId, setCleanerId] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Line[]>([{ itemId: "", quantity: "" }]);
  const [confirmQty, setConfirmQty] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  // Current on-hand stock for the confirm step (non-management only).
  const siteInvQuery = useSiteInventory(!canManage && requestType === "SITE" ? siteId || undefined : undefined);
  const cleanerInvQuery = useCleanerInventory(
    !canManage && requestType === "CLEANER" ? cleanerId || undefined : undefined,
  );
  const currentRows = useMemo(() => {
    if (canManage) return [];
    return requestType === "CLEANER"
      ? (cleanerInvQuery.data?.items ?? []).map((i) => ({ itemId: i.itemId, itemName: i.itemName, unit: i.unit, quantity: i.quantity }))
      : (siteInvQuery.data ?? []).map((i) => ({ itemId: i.itemId, itemName: i.itemName, unit: i.unit, quantity: i.quantity }));
  }, [canManage, requestType, siteInvQuery.data, cleanerInvQuery.data]);

  useEffect(() => {
    if (open) {
      setSiteId(fixedSiteId ?? "");
      setRequestType("SITE");
      setSource("WAREHOUSE");
      setCleanerId("");
      setNote("");
      setLines([{ itemId: "", quantity: "" }]);
      setConfirmQty({});
      setError(null);
      createMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fixedSiteId]);

  // Prefill the confirm quantities from current stock whenever the target/context changes.
  const confirmSyncKey = `${requestType}:${siteId}:${cleanerId}:${currentRows.length}`;
  const [confirmSyncedKey, setConfirmSyncedKey] = useState<string | null>(null);
  useEffect(() => {
    if (canManage || !open || currentRows.length === 0 || confirmSyncedKey === confirmSyncKey) return;
    setConfirmSyncedKey(confirmSyncKey);
    setConfirmQty(Object.fromEntries(currentRows.map((r) => [r.itemId, r.quantity])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage, open, confirmSyncKey, confirmSyncedKey, currentRows]);
  useEffect(() => {
    if (!open) setConfirmSyncedKey(null);
  }, [open]);

  const siteOptions: SelectOption[] = useMemo(
    () => (sitesQuery.data ?? []).map((s) => ({ value: s.id, label: s.name })),
    [sitesQuery.data],
  );
  const itemOptions: SelectOption[] = useMemo(
    () => (itemsQuery.data ?? []).map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` })),
    [itemsQuery.data],
  );
  const cleanerOptions: SelectOption[] = useMemo(
    () =>
      (cleanersQuery.data ?? []).map((c) => ({
        value: c.id,
        label: `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.email || c.id,
      })),
    [cleanersQuery.data],
  );

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!siteId) return setError("Select a site.");
    if (requestType === "CLEANER" && !cleanerId) return setError("Select a cleaner to issue items to.");
    const cleaned = lines
      .filter((l) => l.itemId && parseFloat(l.quantity) > 0)
      .map((l) => ({ itemId: l.itemId, requestedQuantity: parseFloat(l.quantity) }));
    if (cleaned.length === 0) return setError("Add at least one item with a quantity.");
    const confirmedStock = canManage
      ? undefined
      : currentRows.map((r) => ({ itemId: r.itemId, quantity: confirmQty[r.itemId] ?? r.quantity }));
    createMutation.mutate(
      {
        siteId,
        requestType,
        source,
        cleanerId: requestType === "CLEANER" ? cleanerId : undefined,
        note: note.trim() || undefined,
        confirmedStock,
        lines: cleaned,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request items"
      description="Ask management to deliver items to a site or issue them to a cleaner."
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-on-surface">Request type</span>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(REQUEST_TYPE_LABELS) as RequestType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setRequestType(type)}
                aria-pressed={requestType === type}
                className={
                  "h-11 rounded-xl border px-3 text-sm font-semibold transition-colors " +
                  (requestType === type
                    ? "border-primary bg-primary/10 text-ink"
                    : "border-grey-300 text-grey-500 hover:border-primary/50")
                }
              >
                {REQUEST_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {!fixedSiteId && (
          <SearchableSelect
            label="Site"
            required
            options={siteOptions}
            value={siteId || null}
            onChange={setSiteId}
            loading={sitesQuery.isLoading}
            placeholder="Select a site"
          />
        )}

        {requestType === "CLEANER" && (
          <SearchableSelect
            label="Cleaner"
            required
            options={cleanerOptions}
            value={cleanerId || null}
            onChange={setCleanerId}
            loading={cleanersQuery.isLoading}
            placeholder="Select a cleaner"
          />
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-on-surface">Request from</span>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(REQUEST_SOURCE_LABELS) as RequestSource[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSource(s)}
                aria-pressed={source === s}
                className={
                  "h-11 rounded-xl border px-3 text-sm font-semibold transition-colors " +
                  (source === s
                    ? "border-primary bg-primary/10 text-ink"
                    : "border-grey-300 text-grey-500 hover:border-primary/50")
                }
              >
                {REQUEST_SOURCE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {!canManage && (requestType === "CLEANER" ? cleanerId : siteId) && (
          <div className="flex flex-col gap-2 rounded-xl border border-grey-200 bg-grey-50 p-3">
            <span className="text-sm font-medium text-on-surface">
              Confirm current {requestType === "CLEANER" ? "cleaner" : "site"} inventory
            </span>
            <p className="text-xs text-grey-500">Update these to match what's actually on hand before requesting.</p>
            {(requestType === "CLEANER" ? cleanerInvQuery.isLoading : siteInvQuery.isLoading) ? (
              <p className="py-2 text-center text-xs text-grey-500">Loading current stock…</p>
            ) : currentRows.length === 0 ? (
              <p className="py-2 text-center text-xs text-grey-500">No items currently held.</p>
            ) : (
              currentRows.map((r) => (
                <div key={r.itemId} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-sm text-on-surface">{r.itemName}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={confirmQty[r.itemId] ?? r.quantity}
                      onChange={(e) =>
                        setConfirmQty((prev) => ({ ...prev, [r.itemId]: Math.max(0, Number(e.target.value) || 0) }))
                      }
                      aria-label={`Current ${r.itemName}`}
                      className="h-9 w-20 rounded-lg border border-grey-300 bg-white px-2 text-center text-sm outline-none focus:border-primary"
                    />
                    <span className="w-10 text-xs text-grey-500">{r.unit}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-on-surface">Items</span>
          {lines.map((line, idx) => (
            <div key={idx} className="flex items-end gap-2">
              <div className="flex-1">
                <SearchableSelect
                  label=""
                  options={itemOptions}
                  value={line.itemId || null}
                  onChange={(v) => updateLine(idx, { itemId: v })}
                  loading={itemsQuery.isLoading}
                  placeholder="Select item"
                />
              </div>
              <input
                type="number"
                min="0"
                step="0.001"
                placeholder="Qty"
                value={line.quantity}
                onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                aria-label="Quantity"
                className="h-11 w-24 rounded-xl border border-grey-300 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {lines.length > 1 && (
                <button
                  type="button"
                  aria-label="Remove line"
                  onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                  className="flex h-11 w-9 items-center justify-center rounded-lg text-grey-500 hover:bg-red-50 hover:text-danger"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, { itemId: "", quantity: "" }])}
            className="mt-1 flex items-center gap-1.5 self-start rounded-lg border border-dashed border-grey-300 px-3 py-1.5 text-xs font-medium text-grey-500 hover:border-primary hover:text-ink"
          >
            <Plus size={14} aria-hidden="true" />
            Add item
          </button>
        </div>

        <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />

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
            {createMutation.isPending ? "Submitting…" : "Submit request"}
          </PillButton>
        </div>
      </form>
    </Modal>
  );
}
