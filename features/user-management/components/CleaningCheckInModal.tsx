"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plus, StickyNote, Trash2, PackageCheck } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { cn } from "@/lib/utils/cn";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { useInventoryItems } from "@/features/inventory/hooks/useInventory";
import type { SiteInventory } from "@/features/inventory/schemas/inventory.schema";
import type { SiteCleaningTemplate } from "@/features/user-management/schemas/site.schema";

interface ItemRow {
  itemId: string;
  itemName: string;
  unit: string;
  quantity: number;
}

export interface CheckInSubmit {
  siteCleaningTemplateId: string;
  note?: string;
  items?: Array<{ itemId: string; quantity: number }>;
}

interface CleaningCheckInModalProps {
  open: boolean;
  onClose: () => void;
  templates: SiteCleaningTemplate[];
  inventory: SiteInventory[];
  areaName: string;
  dayLabel: string;
  submitting?: boolean;
  error?: string | null;
  onSubmit: (payload: CheckInSubmit) => void;
}

/**
 * Schedules a cleaning task on a hotel area/day. The client picks a task type (badge), reviews and
 * edits the items it consumes (prefilled from the type's defaults), optionally adds special
 * instructions, and submits. Low-stock is surfaced as a non-blocking warning.
 */
export function CleaningCheckInModal({
  open,
  onClose,
  templates,
  inventory,
  areaName,
  dayLabel,
  submitting = false,
  error,
  onSubmit,
}: CleaningCheckInModalProps) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [rows, setRows] = useState<ItemRow[]>([]);
  const [note, setNote] = useState("");
  const [tab, setTab] = useState<"items" | "notes">("items");

  const itemsQuery = useInventoryItems(true);

  // Reset when the modal opens fresh.
  useEffect(() => {
    if (open) {
      setSelectedId("");
      setRows([]);
      setNote("");
      setTab("items");
    }
  }, [open]);

  const selected = templates.find((t) => t.id === selectedId);

  function selectTemplate(id: string) {
    setSelectedId(id);
    const tpl = templates.find((t) => t.id === id);
    setRows(
      (tpl?.items ?? []).map((it) => ({
        itemId: it.itemId,
        itemName: it.itemName,
        unit: it.unit,
        quantity: it.quantity,
      })),
    );
    setTab("items");
  }

  // On-hand stock per item at this site.
  const stockByItem = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of inventory) map.set(inv.itemId, inv.quantity);
    return map;
  }, [inventory]);

  const addOptions: SelectOption[] = useMemo(() => {
    const chosen = new Set(rows.map((r) => r.itemId));
    return (itemsQuery.data ?? [])
      .filter((it) => !chosen.has(it.id))
      .map((it) => ({ value: it.id, label: `${it.name} (${it.unit})` }));
  }, [itemsQuery.data, rows]);

  function addItem(itemId: string) {
    const item = itemsQuery.data?.find((it) => it.id === itemId);
    if (!item) return;
    setRows((prev) => [...prev, { itemId: item.id, itemName: item.name, unit: item.unit, quantity: 1 }]);
  }

  function updateQty(itemId: string, quantity: number) {
    setRows((prev) => prev.map((r) => (r.itemId === itemId ? { ...r, quantity } : r)));
  }

  function removeItem(itemId: string) {
    setRows((prev) => prev.filter((r) => r.itemId !== itemId));
  }

  const shortages = useMemo(
    () => rows.filter((r) => r.quantity > (stockByItem.get(r.itemId) ?? 0)),
    [rows, stockByItem],
  );

  function handleSubmit() {
    if (!selectedId) return;
    const items = rows
      .filter((r) => r.quantity > 0)
      .map((r) => ({ itemId: r.itemId, quantity: r.quantity }));
    onSubmit({
      siteCleaningTemplateId: selectedId,
      note: note.trim() || undefined,
      // Only send an override when it differs from an empty default; always send when a template
      // has been prefilled/edited so the occurrence's items are explicit.
      items,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule a cleaning task"
      description={`${areaName} · ${dayLabel}`}
      maxWidthClassName="max-w-xl"
    >
      <div className="flex flex-col gap-5">
        {/* Badge selection */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-grey-500">
            What needs to be done?
          </p>
          {templates.length === 0 ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              No task types are configured for this site yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => {
                const isActive = t.id === selectedId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTemplate(t.id)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      isActive
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-grey-300 bg-white text-on-surface hover:border-primary hover:text-ink",
                    )}
                  >
                    {t.templateName ?? "Task"}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selected && (
          <>
            {/* Tabs */}
            <div className="flex gap-1 rounded-xl bg-grey-100 p-1">
              <button
                type="button"
                onClick={() => setTab("items")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === "items" ? "bg-white text-ink shadow-sm" : "text-grey-500 hover:text-ink",
                )}
              >
                <PackageCheck size={15} aria-hidden="true" /> Items
              </button>
              <button
                type="button"
                onClick={() => setTab("notes")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === "notes" ? "bg-white text-ink shadow-sm" : "text-grey-500 hover:text-ink",
                )}
              >
                <StickyNote size={15} aria-hidden="true" /> Notes
              </button>
            </div>

            {tab === "items" ? (
              <div className="flex flex-col gap-3">
                {shortages.length > 0 && (
                  <div className="flex items-start gap-2 rounded-lg bg-[#ED5F25]/10 px-3 py-2 text-xs text-[#ED5F25]">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>
                      Not enough stock for {shortages.length} item{shortages.length === 1 ? "" : "s"}. You
                      can still schedule this — request a restock to cover the shortfall.
                    </span>
                  </div>
                )}

                {rows.length === 0 ? (
                  <p className="rounded-lg bg-grey-50 px-3 py-3 text-center text-xs text-grey-500">
                    No items yet. Add the items this task will consume.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {rows.map((r) => {
                      const stock = stockByItem.get(r.itemId) ?? 0;
                      const short = r.quantity > stock;
                      return (
                        <li
                          key={r.itemId}
                          className="flex items-center gap-3 rounded-xl border border-grey-200 bg-white px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-on-surface">{r.itemName}</p>
                            <p className={cn("text-xs", short ? "text-[#ED5F25]" : "text-grey-500")}>
                              In stock: {stock} {r.unit}
                            </p>
                          </div>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={r.quantity}
                            onChange={(e) => updateQty(r.itemId, parseFloat(e.target.value) || 0)}
                            className="h-9 w-20 rounded-lg border border-grey-300 px-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <span className="w-10 shrink-0 text-xs text-grey-500">{r.unit}</span>
                          <button
                            type="button"
                            onClick={() => removeItem(r.itemId)}
                            aria-label={`Remove ${r.itemName}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-grey-400 transition-colors hover:bg-error/10 hover:text-error"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      label="Add an item"
                      options={addOptions}
                      value={null}
                      onChange={addItem}
                      loading={itemsQuery.isLoading}
                      placeholder="Search items to add…"
                    />
                  </div>
                  <span className="pb-2 text-grey-300">
                    <Plus size={18} aria-hidden="true" />
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="checkin-note" className="text-xs font-semibold uppercase tracking-wide text-grey-500">
                  Special instructions
                </label>
                <textarea
                  id="checkin-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={5}
                  placeholder="e.g. Guest checking out early — prioritise this room before 10am."
                  className="w-full resize-none rounded-xl border border-grey-300 px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}
          </>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-grey-300 px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedId || submitting}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-variant disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Scheduling…" : "Schedule & notify"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
