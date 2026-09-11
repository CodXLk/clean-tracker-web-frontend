"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { cn } from "@/lib/utils/cn";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { useInventoryItems, useTransactions, useInventoryEvents } from "@/features/inventory/hooks/useInventory";
import {
  TRANSACTION_TYPE_LABELS,
  INVENTORY_EVENT_TYPE_LABELS,
  type TransactionType,
} from "@/features/inventory/schemas/inventory.schema";
import { fmtQty, fmtDateTime } from "@/features/inventory/lib/inventory";

const TYPE_OPTIONS: SelectOption[] = (Object.keys(TRANSACTION_TYPE_LABELS) as TransactionType[]).map((t) => ({
  value: t,
  label: TRANSACTION_TYPE_LABELS[t],
}));

const VIEWS = ["Activity", "Stock ledger"] as const;
type View = (typeof VIEWS)[number];

export function LogsTab() {
  const [view, setView] = useState<View>("Activity");

  return (
    <div className="flex flex-col gap-4">
      <FilterTabs<View> options={[...VIEWS]} value={view} onChange={setView} />
      {view === "Activity" ? <ActivityLog /> : <StockLedger />}
    </div>
  );
}

/** Request/delivery workflow events — who did what and when. */
function ActivityLog() {
  const query = useInventoryEvents();
  const rows = query.data ?? [];

  if (query.isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size={28} /></div>;
  }
  if (query.isError) return <ErrorMessage message="Failed to load activity." />;
  if (rows.length === 0) {
    return <EmptyState title="No activity yet" description="Request and delivery events are recorded here as they happen." />;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-grey-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-grey-200 text-left text-xs font-semibold uppercase tracking-wide text-grey-500">
            <th className="px-4 py-3">When</th>
            <th className="px-4 py-3">Event</th>
            <th className="px-4 py-3">Details</th>
            <th className="px-4 py-3">By</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id} className="border-b border-grey-100 last:border-b-0">
              <td className="whitespace-nowrap px-4 py-3 text-grey-500">{fmtDateTime(e.performedAt)}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-grey-100 px-2 py-0.5 text-xs text-grey-600">
                  {INVENTORY_EVENT_TYPE_LABELS[e.eventType]}
                </span>
              </td>
              <td className="px-4 py-3 text-on-surface">{e.message ?? "—"}</td>
              <td className="px-4 py-3 text-grey-500">{e.performedByName ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Immutable stock-movement ledger. */
function StockLedger() {
  const itemsQuery = useInventoryItems();
  const [itemId, setItemId] = useState<string>("");
  const [type, setType] = useState<string>("");

  const filters = useMemo(
    () => ({ ...(itemId ? { itemId } : {}), ...(type ? { type } : {}) }),
    [itemId, type],
  );
  const query = useTransactions(filters);
  const rows = query.data ?? [];

  const itemOptions: SelectOption[] = useMemo(
    () => (itemsQuery.data ?? []).map((i) => ({ value: i.id, label: i.name })),
    [itemsQuery.data],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:max-w-lg">
        <SearchableSelect label="Item" options={[{ value: "", label: "All items" }, ...itemOptions]} value={itemId || null} onChange={setItemId} placeholder="All items" />
        <SearchableSelect label="Type" options={[{ value: "", label: "All types" }, ...TYPE_OPTIONS]} value={type || null} onChange={setType} placeholder="All types" />
      </div>

      {query.isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size={28} /></div>
      ) : query.isError ? (
        <ErrorMessage message="Failed to load the ledger." />
      ) : rows.length === 0 ? (
        <EmptyState title="No movements" description="Stock movements are audited here as they happen." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-grey-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-grey-200 text-left text-xs font-semibold uppercase tracking-wide text-grey-500">
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Change</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3">By</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-grey-100 last:border-b-0">
                  <td className="whitespace-nowrap px-4 py-3 text-grey-500">{fmtDateTime(t.performedAt)}</td>
                  <td className="px-4 py-3 font-medium text-on-surface">{t.itemName}</td>
                  <td className="px-4 py-3 text-grey-500">{t.siteName}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-grey-100 px-2 py-0.5 text-xs text-grey-600">
                      {TRANSACTION_TYPE_LABELS[t.type]}
                    </span>
                  </td>
                  <td className={cn("px-4 py-3 text-right font-medium", t.quantityDelta < 0 ? "text-danger" : "text-success")}>
                    {t.quantityDelta > 0 ? "+" : ""}{fmtQty(t.quantityDelta)}
                  </td>
                  <td className="px-4 py-3 text-right text-on-surface">{fmtQty(t.balanceAfter)}</td>
                  <td className="px-4 py-3 text-grey-500">{t.performedByName ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
