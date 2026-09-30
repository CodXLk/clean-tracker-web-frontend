"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { useCleaners } from "@/features/cleaners/hooks/useCleaners";
import { useCleanerInventory, useMyCleanerInventory, useSetCleanerMinStock } from "@/features/inventory/hooks/useInventory";
import { CATEGORY_LABELS } from "@/features/inventory/schemas/inventory.schema";
import { fmtQty } from "@/features/inventory/lib/inventory";

interface CleanerInventoryTabProps {
  /** Management can pick any cleaner; otherwise the current cleaner's own stock is shown. */
  canManage: boolean;
}

export function CleanerInventoryTab({ canManage }: CleanerInventoryTabProps) {
  const cleanersQuery = useCleaners();
  const [cleanerId, setCleanerId] = useState<string>("");
  const [editing, setEditing] = useState<{ itemId: string; value: string } | null>(null);
  const setMinStock = useSetCleanerMinStock();

  const managedQuery = useCleanerInventory(canManage ? cleanerId || undefined : undefined);
  const mineQuery = useMyCleanerInventory();
  const query = canManage ? managedQuery : mineQuery;

  const cleanerOptions: SelectOption[] = useMemo(
    () =>
      (cleanersQuery.data ?? []).map((c) => ({
        value: c.id,
        label: `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.email || c.id,
      })),
    [cleanersQuery.data],
  );

  const rows = query.data?.items ?? [];
  const showTable = canManage ? !!cleanerId : true;

  function saveMin(itemId: string) {
    const raw = editing?.value ?? "";
    setMinStock.mutate(
      { cleanerId, itemId, minStock: raw === "" ? undefined : parseFloat(raw) },
      { onSuccess: () => setEditing(null) },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="max-w-sm">
          <SearchableSelect
            label="Cleaner"
            options={cleanerOptions}
            value={cleanerId || null}
            onChange={setCleanerId}
            loading={cleanersQuery.isLoading}
            placeholder="Select a cleaner to view their inventory"
          />
        </div>
      )}

      {canManage && !cleanerId ? (
        <EmptyState title="Select a cleaner" description="Choose a cleaner to see the items issued to them." />
      ) : query.isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size={28} /></div>
      ) : !showTable || rows.length === 0 ? (
        <EmptyState title="No items" description="Items issued to this cleaner will appear here." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-grey-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-grey-200 text-left text-xs font-semibold uppercase tracking-wide text-grey-500">
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">On hand</th>
                <th className="px-4 py-3">Reorder level</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.itemId} className="border-b border-grey-100 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-on-surface">
                    <div className="flex items-center gap-2">
                      {r.itemName}
                      {r.lowStock && (
                        <span className="rounded-full bg-[#ED5F25]/10 px-2 py-0.5 text-xs font-medium text-[#ED5F25]">Low</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-grey-500">{CATEGORY_LABELS[r.category]}</td>
                  <td className="px-4 py-3">
                    <span className={r.lowStock ? "font-semibold text-[#ED5F25]" : ""}>{fmtQty(r.quantity)}</span>{" "}
                    <span className="text-xs text-grey-500">{r.unit}</span>
                  </td>
                  <td className="px-4 py-3">
                    {editing?.itemId === r.itemId ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={editing.value}
                          onChange={(e) => setEditing({ itemId: r.itemId, value: e.target.value })}
                          className="w-20 rounded-lg border border-grey-300 px-2 py-1 text-right text-sm"
                          aria-label={`Reorder level for ${r.itemName}`}
                        />
                        <button
                          type="button"
                          aria-label="Save"
                          onClick={() => saveMin(r.itemId)}
                          disabled={setMinStock.isPending}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-variant disabled:opacity-60"
                        >
                          <Check size={14} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label="Cancel"
                          onClick={() => setEditing(null)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-grey-500 hover:bg-grey-100"
                        >
                          <X size={14} aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-grey-700">
                          {r.minStock != null ? `${fmtQty(r.minStock)} ${r.unit}` : "—"}
                        </span>
                        {canManage && (
                          <button
                            type="button"
                            aria-label={`Set reorder level for ${r.itemName}`}
                            onClick={() => setEditing({ itemId: r.itemId, value: r.minStock != null ? String(r.minStock) : "" })}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-grey-500 hover:bg-grey-100 hover:text-ink"
                          >
                            <Pencil size={13} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
