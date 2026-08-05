"use client";

import { useState } from "react";
import { Plus, PackageCheck, Ban } from "lucide-react";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { ConfirmDialog } from "@/features/user-management/components/ConfirmDialog";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { usePurchaseOrders, useCancelPurchaseOrder } from "@/features/inventory/hooks/usePurchaseOrders";
import { PurchaseOrderFormModal } from "./PurchaseOrderFormModal";
import { GoodsReceiptModal } from "./GoodsReceiptModal";
import { StatusBadge } from "./StatusBadge";
import { fmtQty, fmtMoney, fmtDate, fmtDateTime } from "@/features/inventory/lib/inventory";
import type { PurchaseOrder, PurchaseOrderStatus } from "@/features/inventory/schemas/inventory.schema";

const FILTERS = ["All", "Sent", "Partially received", "Received", "Cancelled"] as const;
type Filter = (typeof FILTERS)[number];
const STATUS_MAP: Record<Exclude<Filter, "All">, PurchaseOrderStatus> = {
  Sent: "SENT",
  "Partially received": "PARTIALLY_RECEIVED",
  Received: "RECEIVED",
  Cancelled: "CANCELLED",
};

interface PurchaseOrdersTabProps {
  canManage: boolean;
}

export function PurchaseOrdersTab({ canManage }: PurchaseOrdersTabProps) {
  const [filter, setFilter] = useState<Filter>("All");
  const [formOpen, setFormOpen] = useState(false);
  const [receiving, setReceiving] = useState<PurchaseOrder | null>(null);
  const [cancelling, setCancelling] = useState<PurchaseOrder | null>(null);

  const query = usePurchaseOrders(filter === "All" ? undefined : STATUS_MAP[filter]);
  const cancelMutation = useCancelPurchaseOrder();
  const orders = query.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs<Filter> options={[...FILTERS]} value={filter} onChange={setFilter} />
        {canManage && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus size={18} aria-hidden="true" />
            New purchase order
          </button>
        )}
      </div>

      {query.isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size={28} /></div>
      ) : query.isError ? (
        <ErrorMessage message="Failed to load purchase orders." />
      ) : orders.length === 0 ? (
        <EmptyState title="No purchase orders" description="Raise a purchase order to a supplier to restock the warehouse." />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((po) => {
            const canReceive = canManage && (po.status === "SENT" || po.status === "PARTIALLY_RECEIVED");
            return (
              <div key={po.id} className="rounded-2xl border border-grey-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-on-surface">{po.poNumber}</span>
                      <StatusBadge status={po.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-grey-500">
                      {po.supplierName}
                      {po.expectedDate ? ` · Expected ${fmtDate(po.expectedDate)}` : ""} · {fmtDateTime(po.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-on-surface">{fmtMoney(po.totalCost)}</span>
                    {canReceive && (
                      <button
                        type="button"
                        onClick={() => setReceiving(po)}
                        className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-variant"
                      >
                        <PackageCheck size={13} aria-hidden="true" /> Receive (GRN)
                      </button>
                    )}
                    {canManage && po.status === "SENT" && (
                      <button
                        type="button"
                        onClick={() => setCancelling(po)}
                        className="flex items-center gap-1 rounded-lg border border-grey-300 px-3 py-1.5 text-xs font-medium text-grey-500 hover:bg-grey-100"
                      >
                        <Ban size={13} aria-hidden="true" /> Cancel
                      </button>
                    )}
                  </div>
                </div>

                <ul className="mt-3 flex flex-wrap gap-2">
                  {po.lines.map((l) => (
                    <li key={l.id} className="rounded-lg bg-grey-100 px-2.5 py-1 text-xs text-on-surface">
                      {l.itemName} ·{" "}
                      <span className="font-medium">
                        {fmtQty(l.receivedQuantity)}/{fmtQty(l.quantity)} {l.unit}
                      </span>
                    </li>
                  ))}
                </ul>
                {po.note && <p className="mt-2 text-xs text-grey-500">“{po.note}”</p>}
              </div>
            );
          })}
        </div>
      )}

      <PurchaseOrderFormModal open={formOpen} onClose={() => setFormOpen(false)} />
      <GoodsReceiptModal open={!!receiving} onClose={() => setReceiving(null)} purchaseOrder={receiving} />
      <ConfirmDialog
        open={!!cancelling}
        title="Cancel purchase order"
        description={`Cancel "${cancelling?.poNumber}"? This cannot be undone.`}
        isPending={cancelMutation.isPending}
        error={cancelMutation.isError ? getErrorMessage(cancelMutation.error) : undefined}
        onConfirm={() => cancelling && cancelMutation.mutate(cancelling.id, { onSuccess: () => setCancelling(null) })}
        onClose={() => { setCancelling(null); cancelMutation.reset(); }}
      />
    </div>
  );
}
