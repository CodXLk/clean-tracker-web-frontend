"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Package, CalendarCheck } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils/cn";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { useClientPortalSites } from "@/features/user-management/hooks/useSites";
import { useSiteCleaningTemplates } from "@/features/user-management/hooks/useCleaningSchedule";
import { useSiteInventory } from "@/features/inventory/hooks/useInventory";
import { CATEGORY_LABELS } from "@/features/inventory/schemas/inventory.schema";
import { fmtQty } from "@/features/inventory/lib/inventory";

/**
 * Client-facing read-only view of a site's on-hand inventory. A summary card
 * headlines the total distinct items in stock; the table lists each item with
 * its quantity and low-stock status.
 */
export function ClientItemInventoryTab() {
  const sitesQuery = useClientPortalSites(true);
  const [siteId, setSiteId] = useState<string>("");
  const inventoryQuery = useSiteInventory(siteId || undefined);
  const templatesQuery = useSiteCleaningTemplates(siteId || undefined);

  const siteOptions: SelectOption[] = useMemo(
    () => (sitesQuery.data ?? []).map((s) => ({ value: s.id, label: s.name })),
    [sitesQuery.data],
  );

  // Default to the first available site.
  useEffect(() => {
    const list = sitesQuery.data;
    if (list && list.length > 0 && !list.some((s) => s.id === siteId)) {
      setSiteId(list[0]!.id);
    }
  }, [sitesQuery.data, siteId]);

  const rows = inventoryQuery.data ?? [];
  const itemCount = rows.length;
  const lowCount = rows.filter((r) => r.lowStock).length;

  // How many times each task type could be run given current stock: the limiting item
  // (stock ÷ per-run quantity), floored. A type with no items isn't stock-constrained.
  const stockByItem = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.itemId, r.quantity);
    return map;
  }, [rows]);

  const possibleRuns = useMemo(() => {
    return (templatesQuery.data ?? [])
      .filter((t) => (t.items?.length ?? 0) > 0)
      .map((t) => {
        let count = Infinity;
        for (const it of t.items) {
          const stock = stockByItem.get(it.itemId) ?? 0;
          const perRun = it.quantity;
          count = Math.min(count, perRun > 0 ? Math.floor(stock / perRun) : Infinity);
        }
        return {
          id: t.id,
          name: t.templateName ?? "Task",
          count: Number.isFinite(count) ? count : 0,
        };
      });
  }, [templatesQuery.data, stockByItem]);

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-sm">
        <SearchableSelect
          label="Site"
          options={siteOptions}
          value={siteId || null}
          onChange={setSiteId}
          loading={sitesQuery.isLoading}
          placeholder="Select a site to view its inventory"
        />
      </div>

      {!siteId ? (
        <EmptyState title="Select a site" description="Choose a site to see the items currently in stock." />
      ) : inventoryQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size={28} />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SummaryCard
              icon={<Package size={20} aria-hidden="true" />}
              label="Items in stock"
              value={String(itemCount)}
              tone="brand"
            />
            <SummaryCard
              icon={<AlertTriangle size={20} aria-hidden="true" />}
              label="Low-stock items"
              value={String(lowCount)}
              tone={lowCount > 0 ? "warning" : "neutral"}
            />
          </div>

          {/* How many times each task type could run with current stock */}
          {possibleRuns.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-grey-500">
                Possible tasks with current stock
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {possibleRuns.map((run) => (
                  <div
                    key={run.id}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm",
                      run.count === 0 ? "border-[#ED5F25]/30" : "border-grey-200",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl",
                        run.count === 0 ? "bg-[#ED5F25]/10 text-[#ED5F25]" : "bg-primary/10 text-ink",
                      )}
                    >
                      <CalendarCheck size={20} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-2xl font-semibold text-on-surface">{run.count}</p>
                      <p className="truncate text-xs font-medium text-grey-500">Possible {run.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rows.length === 0 ? (
            <EmptyState title="No stock yet" description="This site has no inventory recorded." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-grey-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-grey-200 text-left text-xs font-semibold uppercase tracking-wide text-grey-500">
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">On hand</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className={cn("border-b border-grey-100 last:border-b-0", r.lowStock && "bg-[#ED5F25]/[0.04]")}
                    >
                      <td className="px-4 py-3 font-medium text-on-surface">{r.itemName}</td>
                      <td className="px-4 py-3 text-grey-500">{CATEGORY_LABELS[r.category]}</td>
                      <td className="px-4 py-3">
                        {fmtQty(r.quantity)} <span className="text-xs text-grey-500">{r.unit}</span>
                      </td>
                      <td className="px-4 py-3">
                        {r.lowStock ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#ED5F25]/10 px-2.5 py-0.5 text-xs font-medium text-[#ED5F25]">
                            <AlertTriangle size={12} aria-hidden="true" /> Low
                          </span>
                        ) : (
                          <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "brand" | "warning" | "neutral";
}) {
  const toneClasses =
    tone === "brand"
      ? "bg-primary/10 text-ink"
      : tone === "warning"
        ? "bg-[#ED5F25]/10 text-[#ED5F25]"
        : "bg-grey-100 text-grey-500";
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-grey-200 bg-white p-4 shadow-sm">
      <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", toneClasses)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-2xl font-semibold text-on-surface">{value}</p>
        <p className="text-xs font-medium text-grey-500">{label}</p>
      </div>
    </div>
  );
}
