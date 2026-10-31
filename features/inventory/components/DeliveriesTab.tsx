"use client";

import { useState } from "react";
import { Truck, PackageCheck, Ban, Eye, History, PackagePlus, UserCog } from "lucide-react";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { EmptyState } from "@/components/shared/EmptyState";
import { DataTable, type Column } from "@/features/user-management/components/DataTable";
import { RowMenu } from "@/features/user-management/components/RowMenu";
import { useDeliveries, useCancelDelivery, useDispatchPending } from "@/features/inventory/hooks/useInventory";
import { DispatchModal } from "./DispatchModal";
import { ConfirmDeliveryModal } from "./ConfirmDeliveryModal";
import { DeliveryDetailModal } from "./DeliveryDetailModal";
import { AuditLogModal } from "./AuditLogModal";
import { StatusBadge } from "./StatusBadge";
import { fmtDateTime } from "@/features/inventory/lib/inventory";
import type { InventoryDelivery, DeliveryStatus } from "@/features/inventory/schemas/inventory.schema";
import { PurchaseDeliveryModal } from "./PurchaseDeliveryModal";
import { WorkflowDeliveryProgressModal, DeliveryAssignmentModal } from "./WorkflowDeliveryControls";
import { useMe } from "@/features/auth/hooks/useMe";
import { useProcurementCapabilities } from "../hooks/useInventoryWorkflow";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";

const FILTERS = ["All", "Pending", "Pending received", "Delivered", "Partially delivered", "Pending dispatch", "Dispatched", "Pending approval", "Received"] as const;
type Filter = (typeof FILTERS)[number];
const STATUS_MAP: Record<Exclude<Filter, "All">, DeliveryStatus> = {
  Pending: "PENDING", "Pending received": "PENDING_RECEIVED", Delivered: "DELIVERED", "Partially delivered": "PARTIALLY_DELIVERED",
  "Pending dispatch": "PENDING_DISPATCH", Dispatched: "DISPATCHED", "Pending approval": "PENDING_APPROVAL", Received: "RECEIVED",
};

type ActionItem = { label: string; icon: typeof Eye; onClick: () => void; destructive?: boolean };

interface DeliveriesTabProps {
  canManage: boolean;
}

export function DeliveriesTab({ canManage }: DeliveriesTabProps) {
  const [filter, setFilter] = useState<Filter>("All");
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [progressing, setProgressing] = useState<InventoryDelivery | null>(null);
  const [assigning, setAssigning] = useState<InventoryDelivery | null>(null);
  const [methodFilter, setMethodFilter] = useState<"All methods" | "Supplier Delivery" | "Hand Carry">("All methods");
  const me = useMe();
  const capabilities = useProcurementCapabilities();
  const [review, setReview] = useState<{ delivery: InventoryDelivery; mode: "confirm" | "approve" } | null>(null);
  const [viewing, setViewing] = useState<InventoryDelivery | null>(null);
  const [auditDelivery, setAuditDelivery] = useState<InventoryDelivery | null>(null);

  const query = useDeliveries(filter === "All" ? {} : { status: STATUS_MAP[filter] });
  const cancel = useCancelDelivery();
  const dispatchPending = useDispatchPending();
  const deliveries = (query.data ?? []).filter(delivery => methodFilter === "All methods"
    || delivery.procurementMethod === (methodFilter === "Hand Carry" ? "HAND_CARRY" : "SUPPLIER_DELIVERY"));

  const columns: Column<InventoryDelivery>[] = [
    {
      header: "Destination",
      sortAccessor: (d) => d.siteName ?? "",
      cell: (d) => (
        <span className="font-medium text-on-surface">
          {d.siteName ?? (d.targetCleanerId ? "Cleaner inventory" : "—")}
        </span>
      ),
    },
    { header: "Status", sortAccessor: (d) => d.status, cell: (d) => <StatusBadge status={d.status} /> },
    { header: "PO / method", cell: (d) => <div>{d.poNumber ?? "-"}<p className="text-xs text-grey-500">{d.procurementMethod === "HAND_CARRY" ? "Hand Carry" : d.procurementMethod === "SUPPLIER_DELIVERY" ? "Supplier Delivery" : d.source === "CLIENT" ? "Client supply" : "Warehouse transfer"}</p></div> },
    { header: "Receiver / carrier", cell: (d) => <div>{d.assignedReceiverName ?? "-"}{d.handCarryPersonName && <p className="text-xs text-grey-500">Carrier: {d.handCarryPersonName}</p>}</div> },
    { header: "Items", cell: (d) => `${d.lines.length}` },
    { header: "Dispatched by", cell: (d) => (d.status === "PENDING_DISPATCH" ? "—" : d.dispatchedByName ?? "Unknown") },
    {
      header: "When",
      sortAccessor: (d) => d.dispatchedAt ?? d.createdAt ?? "",
      cell: (d) => fmtDateTime(d.status === "PENDING_DISPATCH" ? d.createdAt : d.dispatchedAt),
    },
    {
      header: "",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (d) => {
        const items: ActionItem[] = [
          { label: "View", icon: Eye, onClick: () => setViewing(d) },
          { label: "View audit log", icon: History, onClick: () => setAuditDelivery(d) },
        ];
        if (d.workflowVersion === 2) {
          if (d.status === "PENDING" && (canManage || d.handCarryPersonId === me.data?.id || (d.source === "CLIENT" && me.data?.role === "CLIENT"))) {
            items.push({ label: d.source === "HAND_CARRY" ? "Items brought / Ready for receipt" : "Dispatch", icon: Truck, onClick: () => setProgressing(d) });
          }
          if (d.status === "PENDING_RECEIVED" && (canManage || d.assignedReceiverId === me.data?.id)) {
            items.push({ label: "Confirm receipt", icon: PackageCheck, onClick: () => setReview({ delivery: d, mode: "confirm" }) });
          }
          if (canManage && ["PENDING", "PENDING_RECEIVED"].includes(d.status)) {
            items.push({ label: "Reassign personnel", icon: UserCog, onClick: () => setAssigning(d) });
            items.push({ label: "Cancel", icon: Ban, destructive: true, onClick: () => cancel.mutate(d.id) });
          }
          return <div className="flex justify-end"><RowMenu label={`Actions for ${d.poNumber ?? "delivery"}`} items={items} /></div>;
        }
        if (d.status === "PENDING_DISPATCH" && canManage) {
          items.push({ label: "Dispatch", icon: Truck, onClick: () => dispatchPending.mutate({ id: d.id }) });
          items.push({ label: "Cancel", icon: Ban, destructive: true, onClick: () => cancel.mutate(d.id) });
        }
        if (d.status === "DISPATCHED") {
          items.push({ label: "Confirm receipt", icon: PackageCheck, onClick: () => setReview({ delivery: d, mode: "confirm" }) });
          if (canManage) items.push({ label: "Cancel", icon: Ban, destructive: true, onClick: () => cancel.mutate(d.id) });
        }
        if (d.status === "PENDING_APPROVAL" && canManage) {
          items.push({ label: "Approve receipt", icon: PackageCheck, onClick: () => setReview({ delivery: d, mode: "approve" }) });
          items.push({ label: "Cancel", icon: Ban, destructive: true, onClick: () => cancel.mutate(d.id) });
        }
        return (
          <div className="flex justify-end">
            <RowMenu label={`Actions for delivery to ${d.siteName ?? "cleaner"}`} items={items} />
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2"><FilterSelect<Filter> options={[...FILTERS]} value={filter} onChange={setFilter} label="" />
          <FilterSelect options={["All methods", "Supplier Delivery", "Hand Carry"] as const} value={methodFilter} onChange={setMethodFilter} label="" /></div>
        {capabilities.data?.enabled && (canManage || me.data?.role === "SUPERVISOR") && <button type="button" onClick={() => setPurchaseOpen(true)} className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"><PackagePlus size={16} />Create from purchase order</button>}
        {canManage && (
          <button
            type="button"
            onClick={() => setDispatchOpen(true)}
            className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Truck size={18} aria-hidden="true" />
            {capabilities.data?.enabled ? "New warehouse transfer" : "Direct dispatch"}
          </button>
        )}
      </div>
      {(cancel.isError || dispatchPending.isError) && <p role="alert" className="text-sm text-error">{getErrorMessage(cancel.error ?? dispatchPending.error)}</p>}

      {deliveries.length === 0 && !query.isLoading ? (
        <EmptyState title="No deliveries" description="Dispatched and confirmed deliveries appear here." />
      ) : (
        <DataTable
          rows={deliveries}
          columns={columns}
          getRowId={(d) => d.id}
          isLoading={query.isLoading}
          isError={query.isError}
          errorMessage="Failed to load deliveries."
          emptyTitle="No deliveries"
          emptyDescription="Dispatched and confirmed deliveries appear here."
        />
      )}

      <DispatchModal open={dispatchOpen} onClose={() => setDispatchOpen(false)} />
      {purchaseOpen && <PurchaseDeliveryModal open onClose={() => setPurchaseOpen(false)} canManage={canManage} />}
      {progressing && <WorkflowDeliveryProgressModal delivery={progressing} onClose={() => setProgressing(null)} />}
      {assigning && <DeliveryAssignmentModal delivery={assigning} onClose={() => setAssigning(null)} />}
      <ConfirmDeliveryModal
        open={!!review}
        onClose={() => setReview(null)}
        delivery={review?.delivery ?? null}
        mode={review?.mode ?? "confirm"}
      />
      <DeliveryDetailModal open={!!viewing} onClose={() => setViewing(null)} delivery={viewing} />
      <AuditLogModal
        open={!!auditDelivery}
        onClose={() => setAuditDelivery(null)}
        refType="DELIVERY"
        refId={auditDelivery?.id ?? null}
        title="Delivery audit log"
      />
    </div>
  );
}
