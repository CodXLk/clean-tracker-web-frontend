"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { SearchableSelect } from "@/features/user-management/components/SearchableSelect";
import { useMe } from "@/features/auth/hooks/useMe";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useInventoryPeople, useWorkflowDeliveryAction } from "../hooks/useInventoryWorkflow";
import type { InventoryDelivery } from "../schemas/inventory.schema";

export function WorkflowDeliveryProgressModal({ delivery, onClose }: { delivery: InventoryDelivery; onClose: () => void }) {
  const me = useMe();
  const mutation = useWorkflowDeliveryAction();
  const [reason, setReason] = useState("");
  const operation = useRef(crypto.randomUUID());
  const handCarry = delivery.source === "HAND_CARRY";
  const override = handCarry && me.data?.id !== delivery.handCarryPersonId;
  return <Modal open onClose={() => !mutation.isPending && onClose()} title={handCarry ? "Items brought / Ready for receipt" : "Dispatch delivery"}>
    <form className="flex flex-col gap-4" onSubmit={event => { event.preventDefault(); mutation.mutate({ id: delivery.id, action: "progress",
      body: { version: delivery.version, operationKey: operation.current, overrideReason: reason || undefined } }, { onSuccess: onClose }); }}>
      <p className="text-sm">{delivery.poNumber ?? delivery.siteName ?? "Cleaner inventory"}</p>
      {handCarry && <p className="text-sm text-grey-500">Hand-carry person: {delivery.handCarryPersonName ?? "Not assigned"}</p>}
      {override && <TextField label="Management override reason" required value={reason} onChange={event => setReason(event.target.value)} />}
      {mutation.isError && <p role="alert" className="text-sm text-error">{getErrorMessage(mutation.error)}</p>}
      <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
        <button type="submit" disabled={mutation.isPending || (override && !reason.trim())} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{mutation.isPending ? "Saving..." : handCarry ? "Mark ready for receipt" : "Dispatch"}</button></div>
    </form>
  </Modal>;
}

export function DeliveryAssignmentModal({ delivery, onClose }: { delivery: InventoryDelivery; onClose: () => void }) {
  const type = delivery.orderType ?? (delivery.siteId ? "SITE" : delivery.targetCleanerId ? "CLEANER" : "WAREHOUSE");
  const people = useInventoryPeople(type, delivery.siteId ?? undefined, delivery.targetCleanerId ?? undefined);
  const [receiver, setReceiver] = useState(delivery.assignedReceiverId ?? "");
  const [carrier, setCarrier] = useState(delivery.handCarryPersonId ?? "");
  const [reason, setReason] = useState("");
  const mutation = useWorkflowDeliveryAction();
  return <Modal open onClose={() => !mutation.isPending && onClose()} title="Reassign delivery personnel">
    <form className="flex flex-col gap-4" onSubmit={event => { event.preventDefault(); mutation.mutate({ id: delivery.id, action: "reassign",
      body: { version: delivery.version, receiverId: receiver, carrierId: delivery.source === "HAND_CARRY" ? carrier : undefined, reason } }, { onSuccess: onClose }); }}>
      <SearchableSelect label="Receiving person" required value={receiver || null} options={(people.data ?? []).map(person => ({ value: person.id, label: person.name }))} onChange={value => setReceiver(value ?? "")} />
      {delivery.source === "HAND_CARRY" && <SearchableSelect label="Hand-carry person" required value={carrier || null} options={(people.data ?? []).map(person => ({ value: person.id, label: person.name }))} onChange={value => setCarrier(value ?? "")} />}
      <TextField label="Reason" required value={reason} onChange={event => setReason(event.target.value)} />
      {(mutation.isError || people.isError) && <p role="alert" className="text-sm text-error">{getErrorMessage(mutation.error ?? people.error)}</p>}
      <button type="submit" disabled={mutation.isPending || !reason.trim() || !receiver} className="self-end rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save assignments</button>
    </form>
  </Modal>;
}