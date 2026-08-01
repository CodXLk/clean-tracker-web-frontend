"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PillButton } from "@/components/shared/PillButton";
import { useMySites } from "@/features/attendance/hooks/useAttendance";
import { useInventoryItems, useCreateRequest } from "@/features/inventory/hooks/useInventory";
import { fmtQty } from "@/features/inventory/lib/inventory";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";

interface RequestItemsModalProps {
  open:     boolean;
  onClose:  () => void;
}

export function RequestItemsModal({ open, onClose }: RequestItemsModalProps) {
  const sitesQuery = useMySites();
  const itemsQuery = useInventoryItems(true);
  const createMutation = useCreateRequest();

  const [siteId,     setSiteId]     = useState("");
  const [search,     setSearch]     = useState("");
  const [note,       setNote]       = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error,      setError]      = useState<string | null>(null);

  const sites = useMemo(() => sitesQuery.data ?? [], [sitesQuery.data]);
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);

  useEffect(() => {
    if (open) {
      setSearch("");
      setNote("");
      setQuantities({});
      setError(null);
      createMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Default the site to the cleaner's only/first site.
  useEffect(() => {
    if (open && !siteId && sites.length > 0) {
      setSiteId(sites[0].siteId);
    }
  }, [open, siteId, sites]);

  if (!open) return null;

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedItems = items.filter((item) => (quantities[item.id] ?? 0) > 0);

  function addItem(id: string) {
    setQuantities((prev) => ({ ...prev, [id]: 1 }));
  }

  function increment(id: string) {
    setQuantities((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }

  function decrement(id: string) {
    setQuantities((prev) => {
      const next = (prev[id] ?? 0) - 1;
      if (next <= 0) {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      }
      return { ...prev, [id]: next };
    });
  }

  function handleSubmit() {
    setError(null);
    if (!siteId) {
      setError("Select a site to request items for.");
      return;
    }
    const lines = selectedItems.map((item) => ({
      itemId: item.id,
      requestedQuantity: quantities[item.id],
    }));
    if (lines.length === 0) {
      setError("Add at least one item.");
      return;
    }
    createMutation.mutate(
      { siteId, note: note.trim() || undefined, lines },
      { onSuccess: onClose },
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Request items"
        className={cn(
          "fixed z-50 bg-white p-6",
          "inset-x-0 bottom-0 rounded-t-3xl max-h-[85vh] overflow-y-auto",
          "lg:inset-0 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-md lg:rounded-3xl lg:shadow-2xl",
        )}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface">Request Items</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-0.5 text-danger transition-colors hover:bg-danger/10"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Site selector (shown when the cleaner covers more than one site) */}
        {sites.length > 1 && (
          <div className="mb-4">
            <label htmlFor="request-site" className="mb-1 block text-xs font-medium text-grey-700">
              Site
            </label>
            <select
              id="request-site"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full rounded-xl border border-grey-300 bg-white px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
            >
              {sites.map((site) => (
                <option key={site.siteId} value={site.siteId}>
                  {site.siteName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search */}
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-grey-100 px-3 py-2">
          <Search size={16} className="shrink-0 text-grey-500" />
          <input
            type="text"
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-grey-500 outline-none"
          />
        </div>

        {/* Item list */}
        <div className="mb-5 flex flex-col gap-2">
          {itemsQuery.isLoading ? (
            <p className="py-4 text-center text-sm text-grey-500">Loading items…</p>
          ) : filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-grey-500">No items found.</p>
          ) : (
            filtered.map((item) => {
              const qty = quantities[item.id] ?? 0;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-on-surface truncate">
                      {item.name}
                    </span>
                    <span className="shrink-0 rounded-full bg-grey-100 px-2.5 py-0.5 text-xs text-grey-700">
                      {fmtQty(item.mainStockQuantity)} {item.unit}
                    </span>
                  </div>
                  {qty === 0 ? (
                    <button
                      onClick={() => addItem(item.id)}
                      className="shrink-0 rounded-xl border border-primary px-3 py-1 text-sm text-primary transition-colors hover:bg-primary/10"
                    >
                      + Add
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decrement(item.id)}
                        aria-label={`Remove one ${item.name}`}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"
                      >
                        <Minus size={12} strokeWidth={2.5} />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                      <button
                        onClick={() => increment(item.id)}
                        aria-label={`Add one ${item.name}`}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"
                      >
                        <Plus size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Selected items */}
        {selectedItems.length > 0 && (
          <>
            <hr className="mb-4 border-grey-300" />
            <h3 className="mb-3 text-sm font-semibold text-grey-700">Selected Items</h3>
            <div className="mb-4 flex flex-col gap-2">
              {selectedItems.map((item) => {
                const qty = quantities[item.id] ?? 0;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-grey-100 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-on-surface">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decrement(item.id)}
                        aria-label={`Remove one ${item.name}`}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"
                      >
                        <Minus size={12} strokeWidth={2.5} />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                      <button
                        onClick={() => increment(item.id)}
                        aria-label={`Add one ${item.name}`}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"
                      >
                        <Plus size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Note */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note (optional)"
          rows={2}
          maxLength={1000}
          className="mb-3 w-full resize-none rounded-xl border border-grey-300 p-3 text-sm text-on-surface outline-none focus:border-primary"
        />

        {(error || createMutation.isError) && (
          <p role="alert" className="mb-3 rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {error ?? getErrorMessage(createMutation.error)}
          </p>
        )}

        {/* Submit */}
        <PillButton
          variant="teal"
          className="w-full"
          onClick={handleSubmit}
          disabled={selectedItems.length === 0 || createMutation.isPending}
        >
          {createMutation.isPending ? "Submitting…" : "Submit Request"}
        </PillButton>

        <p className="mt-3 text-center text-xs text-grey-500">
          Requests will be reviewed by your supervisor.
        </p>
      </div>
    </>
  );
}
