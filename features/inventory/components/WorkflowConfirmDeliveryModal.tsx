"use client";

import { useRef, useState } from "react";
import { Check, PackageCheck } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { useMe } from "@/features/auth/hooks/useMe";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useWorkflowDeliveryAction } from "../hooks/useInventoryWorkflow";
import type { InventoryDelivery } from "../schemas/inventory.schema";

type Actual = { quantity: string; minStock: string; batch: string; manufactured: string; expires: string; cost: string };
const emptyActual = (): Actual => ({ quantity: "", minStock: "", batch: "", manufactured: "", expires: "", cost: "" });

export function WorkflowConfirmDeliveryModal({ delivery, onClose }: { delivery: InventoryDelivery; onClose: () => void }) {
  const me = useMe();
  const confirm = useWorkflowDeliveryAction();
  const [values, setValues] = useState<Record<string, Actual>>({});
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const operation = useRef(crypto.randomUUID());
  const override = me.data?.id !== delivery.assignedReceiverId;
  function update(id: string, patch: Partial<Actual>) { setValues(current => ({ ...current, [id]: { ...(current[id] ?? emptyActual()), ...patch } })); }
  function submit() {
    setError(null);
    if (delivery.lines.some(line => !values[line.id]?.quantity.trim() || !Number.isFinite(Number(values[line.id]!.quantity)) || Number(values[line.id]!.quantity) < 0)) {
      setError("Enter the actual quantity for every item, including zero when none arrived."); return;
    }
    confirm.mutate({ id: delivery.id, action: "confirm", body: { version: delivery.version, operationKey: operation.current,
      overrideReason: override ? reason.trim() : undefined, note: note.trim() || undefined,
      lines: delivery.lines.map(line => { const value = values[line.id]!; return { lineId: line.id, confirmedQuantity: Number(value.quantity),
        minStock: value.minStock ? Number(value.minStock) : undefined, batchNumber: value.batch || undefined,
        manufactureDate: value.manufactured || undefined, expireDate: value.expires || undefined, unitCost: value.cost ? Number(value.cost) : undefined }; }),
    } }, { onSuccess: onClose });
  }
  return <Modal open onClose={() => !confirm.isPending && onClose()} title="Confirm actual quantities received" maxWidthClassName="max-w-2xl">
    <form className="flex flex-col gap-4" onSubmit={event => { event.preventDefault(); submit(); }}>
      <div className="grid grid-cols-2 gap-3 text-sm"><p>{delivery.poNumber ?? delivery.siteName ?? "Cleaner inventory"}</p><p>{delivery.procurementMethod === "HAND_CARRY" ? "Hand Carry" : delivery.source === "CLIENT" ? "Client supply" : delivery.procurementMethod === "SUPPLIER_DELIVERY" ? "Supplier Delivery" : "Warehouse transfer"}</p>
        <p>Receiver: {delivery.assignedReceiverName ?? "Not assigned"}</p>{delivery.handCarryPersonName && <p>Carrier: {delivery.handCarryPersonName}</p>}</div>
      <button type="button" onClick={() => delivery.lines.forEach(line => update(line.id, { quantity: String(line.expectedQuantity) }))} className="flex items-center gap-2 self-start rounded-lg border px-3 py-2 text-sm"><PackageCheck size={16} />Use all expected quantities</button>
      {delivery.lines.map(line => { const value = values[line.id] ?? emptyActual(); return <section key={line.id} className="border-b border-grey-200 pb-3">
        <div className="grid grid-cols-[minmax(0,1fr)_8rem] items-end gap-3"><div className="text-sm"><p className="font-medium">{line.itemName}</p><p className="text-xs text-grey-500">Expected: {line.expectedQuantity} {line.unit}</p></div>
          <TextField label="Actual received" required type="number" min="0" step="0.001" value={value.quantity} onChange={event => update(line.id, { quantity: event.target.value })} /></div>
        <details className="mt-2 text-sm"><summary className="cursor-pointer text-grey-600">Batch and stock details</summary><div className="mt-3 grid grid-cols-2 gap-3">
          <TextField label="Batch number" value={value.batch} onChange={event => update(line.id, { batch: event.target.value })} />
          <TextField label="Unit cost" type="number" min="0" step="0.01" value={value.cost} onChange={event => update(line.id, { cost: event.target.value })} />
          <TextField label="Manufactured" type="date" value={value.manufactured} onChange={event => update(line.id, { manufactured: event.target.value })} />
          <TextField label="Expires" type="date" value={value.expires} onChange={event => update(line.id, { expires: event.target.value })} />
          {delivery.siteId && <TextField label="Site reorder level" type="number" min="0" step="0.001" value={value.minStock} onChange={event => update(line.id, { minStock: event.target.value })} />}
        </div></details>
      </section>; })}
      {override && <TextField label="Management override reason" required value={reason} onChange={event => setReason(event.target.value)} />}
      <TextField label="Receipt note" value={note} onChange={event => setNote(event.target.value)} />
      {(error || confirm.isError) && <p role="alert" className="text-sm text-error">{error ?? getErrorMessage(confirm.error)}</p>}
      <div className="flex justify-end gap-2"><button type="button" disabled={confirm.isPending} onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
        <button type="submit" disabled={confirm.isPending || me.isLoading || (override && !reason.trim())} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Check size={16} />{confirm.isPending ? "Confirming..." : "Confirm receipt"}</button></div>
    </form>
  </Modal>;
}