"use client";

import { useState } from "react";
import { Truck, PackageCheck, Ban } from "lucide-react";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { useDeliveries, useCancelDelivery } from "@/features/inventory/hooks/useInventory";
import { DispatchModal } from "./DispatchModal";
import { ConfirmDeliveryModal } from "./ConfirmDeliveryModal";
import { StatusBadge } from "./StatusBadge";
import { fmtQty, fmtDateTime } from "@/features/inventory/lib/inventory";
import type { InventoryDelivery, DeliveryStatus } from "@/features/inventory/schemas/inventory.schema";

const FILTERS = ["All", "Dispatched", "Confirmed"] as const;
type Filter = (typeof FILTERS)[number];
const STATUS_MAP: Record<Exclude<Filter, "All">, DeliveryStatus> = {
  Dispatched: "DISPATCHED", Confirmed: "CONFIRMED",
};

interface DeliveriesTabProps {
  canManage: boolean;
}

export function DeliveriesTab({ canManage }: DeliveriesTabProps) {
  const [filter, setFilter] = useState<Filter>("All");
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [confirming, setConfirming] = useState<InventoryDelivery | null>(null);

  const query = useDeliveries(filter === "All" ? {} : { status: STATUS_MAP[filter] });
  const cancel = useCancelDelivery();
  const deliveries = query.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs<Filter> options={[...FILTERS]} value={filter} onChange={setFilter} />
        {canManage && (
          <button
            type="button"
            onClick={() => setDispatchOpen(true)}
            className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Truck size={18} aria-hidden="true" />
            Direct dispatch
          </button>
        )}
      </div>

      {query.isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size={28} /></div>
      ) : query.isError ? (
        <ErrorMessage message="Failed to load deliveries." />
      ) : deliveries.length === 0 ? (
        <EmptyState title="No deliveries" description="Dispatched and confirmed deliveries appear here." />
      ) : (
        <div className="flex flex-col gap-3">
          {deliveries.map((d) => (
            <div key={d.id} className="rounded-2xl border border-grey-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-on-surface">{d.siteName}</span>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-grey-500">
                    Dispatched by {d.dispatchedByName ?? "Unknown"} · {fmtDateTime(d.dispatchedAt)}
                  </p>
                </div>
                {d.status === "DISPATCHED" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => setConfirming(d)}
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-variant">
                      <PackageCheck size={13} aria-hidden="true" /> Confirm receipt
                    </button>
                    {canManage && (
                      <button type="button" onClick={() => cancel.mutate(d.id)}
                        className="flex items-center gap-1 rounded-lg border border-grey-300 px-3 py-1.5 text-xs font-medium text-grey-500 hover:bg-grey-100">
                        <Ban size={13} aria-hidden="true" /> Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>

              <ul className="mt-3 flex flex-wrap gap-2">
                {d.lines.map((l) => (
                  <li key={l.id} className="rounded-lg bg-grey-100 px-2.5 py-1 text-xs text-on-surface">
                    {l.itemName} ·{" "}
                    <span className="font-medium">
                      {d.status === "CONFIRMED" && l.confirmedQuantity != null
                        ? `${fmtQty(l.confirmedQuantity)} ${l.unit} received`
                        : `${fmtQty(l.expectedQuantity)} ${l.unit} sent`}
                    </span>
                  </li>
                ))}
              </ul>
              {d.confirmedByName && (
                <p className="mt-2 text-xs text-grey-400">
                  Confirmed by {d.confirmedByName} · {fmtDateTime(d.confirmedAt)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <DispatchModal open={dispatchOpen} onClose={() => setDispatchOpen(false)} />
      <ConfirmDeliveryModal open={!!confirming} onClose={() => setConfirming(null)} delivery={confirming} />
    </div>
  );
}
