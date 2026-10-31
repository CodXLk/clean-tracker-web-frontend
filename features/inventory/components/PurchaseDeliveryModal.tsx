"use client";

import { useRef, useState } from "react";
import { PackagePlus } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { SearchableSelect } from "@/features/user-management/components/SearchableSelect";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { usePurchaseOrders } from "../hooks/usePurchaseOrders";
import { useDeliveries } from "../hooks/useInventory";
import { useCreatePurchaseDelivery } from "../hooks/useInventoryWorkflow";

export function PurchaseDeliveryModal({ open, onClose, canManage }: { open: boolean; onClose: () => void; canManage: boolean }) {
  const orders = usePurchaseOrders();
  const deliveries = useDeliveries({});
  const create = useCreatePurchaseDelivery();
  const [orderId, setOrderId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const operation = useRef(crypto.randomUUID());
  const eligibleOrders = (orders.data ?? []).filter(order => order.workflowVersion === 2 && order.status !== "CANCELLED"
    && (order.procurementMethod === "HAND_CARRY" ? ["READY_FOR_PURCHASE", "PENDING_RECEIVED"].includes(order.status)
      : canManage && order.suppliers.some(supplier => ["CONFIRMED", "PENDING_RECEIVED"].includes(supplier.status))));
  const order = eligibleOrders.find(candidate => candidate.id === orderId);
  const supplierOptions = order?.suppliers.filter(supplier => ["CONFIRMED", "PENDING_RECEIVED"].includes(supplier.status)) ?? [];
  const selectedSupplier = supplierId || (supplierOptions.length === 1 ? supplierOptions[0]!.supplierId : "");
  const rows = (order?.lines ?? []).filter(line => order?.procurementMethod === "HAND_CARRY" || line.supplierId === selectedSupplier).map(line => {
    const allocated = (deliveries.data ?? []).filter(delivery => delivery.status !== "CANCELLED").flatMap(delivery => delivery.lines)
      .filter(record => record.purchaseOrderLineId === line.id).reduce((sum, record) => sum + record.expectedQuantity, 0);
    return { line, remaining: Math.max(0, line.quantity - allocated) };
  }).filter(row => row.remaining > 0);

  return <Modal open={open} onClose={() => !create.isPending && onClose()} title="Create purchase receiving record" maxWidthClassName="max-w-xl">
    <form className="flex flex-col gap-4" onSubmit={event => {
      event.preventDefault(); if (!order) return;
      create.mutate({ purchaseOrderId: order.id, supplierId: order.procurementMethod === "SUPPLIER_DELIVERY" ? selectedSupplier : undefined,
        operationKey: operation.current, lines: rows.map(({ line, remaining }) => ({ purchaseOrderLineId: line.id, quantity: Number(quantities[line.id] ?? remaining) })).filter(line => line.quantity > 0) }, { onSuccess: onClose });
    }}>
      <SearchableSelect label="Purchase order" required loading={orders.isLoading} value={orderId || null}
        options={eligibleOrders.map(candidate => ({ value: candidate.id, label: candidate.poNumber, sublabel: candidate.procurementMethod === "HAND_CARRY" ? "Hand Carry" : "Supplier Delivery" }))}
        onChange={value => { setOrderId(value ?? ""); setSupplierId(""); setQuantities({}); operation.current = crypto.randomUUID(); }} />
      {order?.procurementMethod === "SUPPLIER_DELIVERY" && <SearchableSelect label="Supplier" required value={selectedSupplier || null}
        options={supplierOptions.map(supplier => ({ value: supplier.supplierId, label: supplier.supplierName }))} onChange={value => { setSupplierId(value ?? ""); setQuantities({}); }} />}
      {order && <p className="text-sm text-grey-600">{order.orderType === "WAREHOUSE" ? "Warehouse" : order.siteName ?? "Cleaner inventory"} - {order.deliveryAddress}</p>}
      {rows.map(({ line, remaining }) => <div key={line.id} className="grid grid-cols-[minmax(0,1fr)_7rem] items-end gap-3 border-b pb-3">
        <div className="text-sm"><p className="font-medium">{line.itemName}</p><p className="text-xs text-grey-500">{remaining} {line.unit} not yet allocated</p></div>
        <TextField label="Expected" type="number" min="0" max={remaining} step="0.001" value={quantities[line.id] ?? String(remaining)} onChange={event => setQuantities(current => ({ ...current, [line.id]: event.target.value }))} />
      </div>)}
      {order && rows.length === 0 && <p className="text-sm text-grey-500">No unallocated quantities for this selection.</p>}
      {(create.isError || orders.isError || deliveries.isError) && <p role="alert" className="text-sm text-error">{getErrorMessage(create.error ?? orders.error ?? deliveries.error)}</p>}
      <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
        <button type="submit" disabled={!order || !rows.length || create.isPending || deliveries.isLoading} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><PackagePlus size={16} />{create.isPending ? "Creating..." : "Create Pending record"}</button></div>
    </form>
  </Modal>;
}