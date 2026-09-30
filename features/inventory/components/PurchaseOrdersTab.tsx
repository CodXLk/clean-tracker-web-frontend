"use client";

import { useState } from "react";
import { Plus, PackageCheck, Ban, Eye, Truck, ClipboardCheck, FileClock, Trash2, Pencil, History } from "lucide-react";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { DataTable, type Column } from "@/features/user-management/components/DataTable";
import { RowMenu } from "@/features/user-management/components/RowMenu";
import { ConfirmDialog } from "@/features/user-management/components/ConfirmDialog";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import {
  usePurchaseOrders,
  useCancelPurchaseOrder,
  useUpdatePurchaseOrderStatus,
} from "@/features/inventory/hooks/usePurchaseOrders";
import {
  usePurchaseOrderDrafts,
  useDeletePurchaseOrderDraft,
  type PurchaseOrderDraft,
} from "@/features/inventory/hooks/usePurchaseOrderDrafts";
import { PurchaseOrderFormModal } from "./PurchaseOrderFormModal";
import { PurchaseOrderDetailModal } from "./PurchaseOrderDetailModal";
import { GoodsReceiptModal } from "./GoodsReceiptModal";
import { AuditLogModal } from "./AuditLogModal";
import { StatusBadge } from "./StatusBadge";
import { fmtDate, fmtDateTime } from "@/features/inventory/lib/inventory";
import type { PurchaseOrder, PurchaseOrderStatus } from "@/features/inventory/schemas/inventory.schema";

const FILTERS = ["All", "Sent", "Awaiting client", "Client dispatched", "Partially received", "Received", "Cancelled"] as const;
type Filter = (typeof FILTERS)[number];
const STATUS_MAP: Record<Exclude<Filter, "All">, PurchaseOrderStatus> = {
  Sent: "SENT",
  "Awaiting client": "AWAITING_CLIENT",
  "Client dispatched": "CLIENT_DISPATCHED",
  "Partially received": "PARTIALLY_RECEIVED",
  Received: "RECEIVED",
  Cancelled: "CANCELLED",
};

type ActionItem = {
  label: string;
  icon: typeof Eye;
  onClick: () => void;
  destructive?: boolean;
};

interface PurchaseOrdersTabProps {
  canManage: boolean;
}

export function PurchaseOrdersTab({ canManage }: PurchaseOrdersTabProps) {
  const [filter, setFilter] = useState<Filter>("All");
  const [formOpen, setFormOpen] = useState(false);
  const [resumeDraft, setResumeDraft] = useState<PurchaseOrderDraft | null>(null);
  const [viewing, setViewing] = useState<PurchaseOrder | null>(null);
  const [auditPo, setAuditPo] = useState<PurchaseOrder | null>(null);
  const [receiving, setReceiving] = useState<PurchaseOrder | null>(null);
  const [cancelling, setCancelling] = useState<PurchaseOrder | null>(null);
  const [deletingDraft, setDeletingDraft] = useState<PurchaseOrderDraft | null>(null);

  const query = usePurchaseOrders(filter === "All" ? undefined : STATUS_MAP[filter]);
  const draftsQuery = usePurchaseOrderDrafts();
  const cancelMutation = useCancelPurchaseOrder();
  const statusMutation = useUpdatePurchaseOrderStatus();
  const deleteDraftMutation = useDeletePurchaseOrderDraft();
  const orders = query.data ?? [];
  const drafts = draftsQuery.data ?? [];

  function openNew() {
    setResumeDraft(null);
    setFormOpen(true);
  }
  function openDraft(d: PurchaseOrderDraft) {
    setResumeDraft(d);
    setFormOpen(true);
  }

  const columns: Column<PurchaseOrder>[] = [
    {
      header: "PO number",
      sortAccessor: (p) => p.poNumber,
      cell: (p) => (
        <div>
          <span className="font-medium text-on-surface">{p.poNumber}</span>
          {p.note && <div className="text-xs text-grey-500">“{p.note}”</div>}
        </div>
      ),
    },
    { header: "Supplier", sortAccessor: (p) => p.supplierName, cell: (p) => p.supplierName },
    { header: "Status", sortAccessor: (p) => p.status, cell: (p) => <StatusBadge status={p.status} /> },
    { header: "Expected", sortAccessor: (p) => p.expectedDate ?? "", cell: (p) => (p.expectedDate ? fmtDate(p.expectedDate) : "—") },
    { header: "Items", cell: (p) => `${p.lines.length}` },
    { header: "Raised", sortAccessor: (p) => p.createdAt ?? "", cell: (p) => fmtDateTime(p.createdAt) },
    {
      header: "",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (p) => {
        const items: ActionItem[] = [{ label: "View", icon: Eye, onClick: () => setViewing(p) }];
        items.push({ label: "View audit log", icon: History, onClick: () => setAuditPo(p) });
        if (canManage) {
          if (p.status === "SENT" || p.status === "PARTIALLY_RECEIVED") {
            items.push({ label: "Receive (GRN)", icon: PackageCheck, onClick: () => setReceiving(p) });
          }
          if (p.status === "SENT") {
            items.push({ label: "Mark awaiting client", icon: ClipboardCheck, onClick: () => statusMutation.mutate({ id: p.id, status: "AWAITING_CLIENT" }) });
          }
          if (p.status === "SENT" || p.status === "AWAITING_CLIENT") {
            items.push({ label: "Mark client dispatched", icon: Truck, onClick: () => statusMutation.mutate({ id: p.id, status: "CLIENT_DISPATCHED" }) });
          }
          if (p.status !== "RECEIVED" && p.status !== "CANCELLED") {
            items.push({ label: "Cancel", icon: Ban, destructive: true, onClick: () => setCancelling(p) });
          }
        }
        return (
          <div className="flex justify-end">
            <RowMenu label={`Actions for ${p.poNumber}`} items={items} />
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs<Filter> options={[...FILTERS]} value={filter} onChange={setFilter} />
        {canManage && (
          <button
            type="button"
            onClick={openNew}
            className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus size={18} aria-hidden="true" />
            New purchase order
          </button>
        )}
      </div>

      {canManage && drafts.length > 0 && (
        <div className="rounded-2xl border border-dashed border-grey-300 bg-grey-50 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-on-surface">
            <FileClock size={16} aria-hidden="true" /> Drafts
          </div>
          <ul className="flex flex-col gap-2">
            {drafts.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                <div className="min-w-0">
                  <span className="text-sm font-medium text-on-surface">{d.title || "Draft purchase order"}</span>
                  <div className="text-xs text-grey-500">
                    {d.supplierName ? `${d.supplierName} · ` : ""}Updated {fmtDateTime(d.updatedAt)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openDraft(d)}
                    className="flex items-center gap-1 rounded-lg border border-grey-300 px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-grey-100"
                  >
                    <Pencil size={13} aria-hidden="true" /> Resume
                  </button>
                  <button
                    type="button"
                    aria-label="Delete draft"
                    onClick={() => setDeletingDraft(d)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 hover:bg-error/10 hover:text-error"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {orders.length === 0 && !query.isLoading ? (
        <EmptyState title="No purchase orders" description="Raise a purchase order to a supplier to restock the warehouse." />
      ) : (
        <DataTable
          rows={orders}
          columns={columns}
          getRowId={(p) => p.id}
          isLoading={query.isLoading}
          isError={query.isError}
          errorMessage="Failed to load purchase orders."
          emptyTitle="No purchase orders"
          emptyDescription="Raise a purchase order to a supplier to restock the warehouse."
        />
      )}

      <PurchaseOrderFormModal open={formOpen} onClose={() => setFormOpen(false)} draft={resumeDraft} />
      <PurchaseOrderDetailModal open={!!viewing} onClose={() => setViewing(null)} order={viewing} />
      <AuditLogModal
        open={!!auditPo}
        onClose={() => setAuditPo(null)}
        refType="PO"
        refId={auditPo?.id ?? null}
        title={auditPo ? `Audit log · ${auditPo.poNumber}` : "Audit log"}
      />
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
      <ConfirmDialog
        open={!!deletingDraft}
        title="Delete draft"
        description="Delete this draft purchase order?"
        isPending={deleteDraftMutation.isPending}
        error={deleteDraftMutation.isError ? getErrorMessage(deleteDraftMutation.error) : undefined}
        onConfirm={() => deletingDraft && deleteDraftMutation.mutate(deletingDraft.id, { onSuccess: () => setDeletingDraft(null) })}
        onClose={() => { setDeletingDraft(null); deleteDraftMutation.reset(); }}
      />
    </div>
  );
}
