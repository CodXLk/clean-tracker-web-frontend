"use client";

import { useState } from "react";
import { History, Send, Check, Truck, ShoppingBag } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { StatusBadge } from "./StatusBadge";
import { AuditLogModal } from "./AuditLogModal";
import { fmtQty, fmtDate, fmtDateTime } from "@/features/inventory/lib/inventory";
import type { PurchaseOrder } from "@/features/inventory/schemas/inventory.schema";
import { useWorkflowPurchaseOrder, useProcurementAction, useInventoryPeople } from "../hooks/useInventoryWorkflow";
import { useSendPurchaseOrder } from "../hooks/usePurchaseOrders";
import { useMe } from "@/features/auth/hooks/useMe";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { ConfirmDialog } from "@/features/user-management/components/ConfirmDialog";

interface PurchaseOrderDetailModalProps {
  open: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-grey-500">{label}</span>
      <span className="text-sm font-medium text-on-surface">{value}</span>
    </div>
  );
}

export function PurchaseOrderDetailModal({ open, onClose, order: initialOrder }: PurchaseOrderDetailModalProps) {
  const [auditOpen, setAuditOpen] = useState(false);
  const [resendSupplier, setResendSupplier] = useState<{ id: string; name: string } | null>(null);
  const query = useWorkflowPurchaseOrder(open && initialOrder?.workflowVersion === 2 ? initialOrder.id : undefined);
  const order = query.data ?? initialOrder;
  const me = useMe();
  const action = useProcurementAction();
  const send = useSendPurchaseOrder();
  const people = useInventoryPeople(order?.orderType ?? "WAREHOUSE", order?.siteId ?? undefined, order?.cleanerId ?? undefined, open && order?.workflowVersion === 2);
  const canManage = ["SUPER_ADMIN", "COMPANY_ADMIN", "CLIENT_SERVICE_MANAGER"].includes(me.data?.role ?? "");
  if (!order) return null;

  return (
    <Modal open={open} onClose={onClose} title={order.poNumber}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <span className="text-xs text-grey-500">Raised {fmtDateTime(order.createdAt)}</span>
          </div>
          <button
            type="button"
            onClick={() => setAuditOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-grey-300 px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-grey-100"
          >
            <History size={13} aria-hidden="true" /> Audit log
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Supplier" value={order.supplierName ?? (order.suppliers.length ? `${order.suppliers.length} suppliers` : "Not assigned")} />
          <Field label="Expected date" value={order.expectedDate ? fmtDate(order.expectedDate) : "—"} />
          <Field label="Delivery address" value={order.deliveryAddress || "—"} />
          <Field label="Supplier email" value={order.supplierEmail || "—"} />
          {order.workflowVersion === 2 && <>
            <Field label="Order type" value={order.orderType === "SITE" ? "Site Inventory" : order.orderType === "CLEANER" ? "Cleaner Inventory" : "Warehouse"} />
            <Field label="Procurement method" value={order.procurementMethod === "HAND_CARRY" ? "Hand Carry" : order.procurementMethod === "SUPPLIER_DELIVERY" ? "Supplier Delivery" : "Not selected"} />
            <Field label="Receiving person" value={order.assignedReceiverName ?? people.data?.find(person => person.id === order.assignedReceiverId)?.name ?? "Not assigned"} />
            {order.procurementMethod === "HAND_CARRY" && <Field label="Hand-carry person" value={order.handCarryPersonName ?? people.data?.find(person => person.id === order.handCarryPersonId)?.name ?? "Not assigned"} />}
            {order.orderType === "SITE" && order.siteName && <Field label="Destination site" value={order.siteName} />}
            {order.orderType === "CLEANER" && order.cleanerName && <Field label="Destination cleaner" value={order.cleanerName} />}
          </>}
        </div>

        <div className="overflow-hidden rounded-xl border border-grey-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-grey-50 text-xs uppercase text-grey-500">
              <tr>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2 text-right">Requested</th>
                <th className="px-3 py-2 text-right">Received</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((l) => (
                <tr key={l.id} className="border-t border-grey-100">
                  <td className="px-3 py-2 text-on-surface">{l.itemName}{l.supplierName && <p className="text-xs text-grey-500">{l.supplierName}</p>}{l.note && <p className="mt-1 text-xs text-grey-600">{l.note}</p>}</td>
                  <td className="px-3 py-2 text-right">{fmtQty(l.quantity)} {l.unit}</td>
                  <td className="px-3 py-2 text-right">{fmtQty(l.receivedQuantity)} {l.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {order.workflowVersion === 2 && order.procurementMethod === "SUPPLIER_DELIVERY" && <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Supplier progress</h3>
          {order.suppliers.map(supplier => <div key={supplier.supplierId} className="flex flex-wrap items-center justify-between gap-2 border-b border-grey-200 pb-3">
            <div><p className="text-sm font-medium">{supplier.supplierName}</p><StatusBadge status={supplier.status} />
              {supplier.recipientEmail && <p className="mt-1 text-xs text-grey-500">{supplier.recipientEmail}{supplier.sentAt ? ` - ${fmtDateTime(supplier.sentAt)}` : " - queued"}</p>}
              {supplier.sendError && <p role="alert" className="mt-1 text-xs text-error">{supplier.sendError}</p>}</div>
            {canManage && supplier.status === "AWAITING_SUPPLIER_CONFIRMATION" && supplier.sentAt && <button type="button" disabled={action.isPending} onClick={() => { action.reset(); setResendSupplier({ id: supplier.supplierId, name: supplier.supplierName }); }} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><Send size={15} />Resend email</button>}
            {canManage && supplier.status === "AWAITING_SUPPLIER_CONFIRMATION" && <button type="button" disabled={action.isPending} onClick={() => action.mutate({ id: order.id, action: "supplier-status", supplierId: supplier.supplierId, status: "CONFIRMED" })} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><Check size={15} />Supplier confirmed</button>}
            {canManage && supplier.status === "CONFIRMED" && <button type="button" disabled={action.isPending} onClick={() => action.mutate({ id: order.id, action: "supplier-status", supplierId: supplier.supplierId, status: "PENDING_RECEIVED" })} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><Truck size={15} />Supplier dispatched</button>}
          </div>)}
          {canManage && ["DRAFT", "AWAITING_SUPPLIER_CONFIRMATION"].includes(order.status) && <button type="button" disabled={send.isPending} onClick={() => send.mutate(order.id)} className="flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"><Send size={16} />{send.isPending ? "Queuing..." : "Send / retry unsent suppliers"}</button>}
        </section>}
        {order.workflowVersion === 2 && order.procurementMethod === "HAND_CARRY" && order.status === "DRAFT"
          && (canManage || me.data?.role === "SUPERVISOR") && <button type="button" disabled={action.isPending} onClick={() => action.mutate({ id: order.id, action: "start-hand-carry" })} className="flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"><ShoppingBag size={16} />Start Hand Carry</button>}
        {(action.isError || send.isError) && <p role="alert" className="text-sm text-error">{getErrorMessage(action.error ?? send.error)}</p>}

        {order.note && (
          <div className="rounded-xl bg-grey-50 px-3 py-2 text-sm text-on-surface-variant">
            <span className="text-xs text-grey-500">Note</span>
            <p className="mt-0.5">{order.note}</p>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-1 h-11 rounded-full border border-grey-300 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100"
        >
          Close
        </button>
      </div>

      <AuditLogModal
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        refType="PO"
        refId={order.id}
        title={`Audit log · ${order.poNumber}`}
      />
      <ConfirmDialog
        open={!!resendSupplier}
        title="Resend supplier email"
        description={`Email ${resendSupplier?.name ?? "this supplier"} again with the same items for ${order.poNumber}?`}
        confirmLabel="Resend"
        tone="primary"
        isPending={action.isPending}
        error={resendSupplier && action.isError ? getErrorMessage(action.error) : undefined}
        onConfirm={() => resendSupplier && action.mutate({ id: order.id, action: "supplier-resend", supplierId: resendSupplier.id },
          { onSuccess: () => setResendSupplier(null) })}
        onClose={() => { if (!action.isPending) setResendSupplier(null); }}
      />
    </Modal>
  );
}
