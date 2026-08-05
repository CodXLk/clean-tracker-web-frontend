"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { useCleaners } from "@/features/cleaners/hooks/useCleaners";
import { useCleanerInventory, useMyCleanerInventory } from "@/features/inventory/hooks/useInventory";
import { CATEGORY_LABELS } from "@/features/inventory/schemas/inventory.schema";
import { fmtQty } from "@/features/inventory/lib/inventory";

interface CleanerInventoryTabProps {
  /** Management can pick any cleaner; otherwise the current cleaner's own stock is shown. */
  canManage: boolean;
}

export function CleanerInventoryTab({ canManage }: CleanerInventoryTabProps) {
  const cleanersQuery = useCleaners();
  const [cleanerId, setCleanerId] = useState<string>("");

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
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.itemId} className="border-b border-grey-100 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-on-surface">{r.itemName}</td>
                  <td className="px-4 py-3 text-grey-500">{CATEGORY_LABELS[r.category]}</td>
                  <td className="px-4 py-3">{fmtQty(r.quantity)} <span className="text-xs text-grey-500">{r.unit}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
