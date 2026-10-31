"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, FilePlus2, Plus, Save, Trash2, X } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { SearchableSelect } from "@/features/user-management/components/SearchableSelect";
import { useMe } from "@/features/auth/hooks/useMe";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useInventoryItems } from "../hooks/useInventory";
import { useInventoryReview, useSaveInventoryReview, useShortagePurchaseOrder, useInventoryReviewDecision, useReleaseInventoryReview, useInventoryPeople, useWorkflowPurchaseOrder } from "../hooks/useInventoryWorkflow";
import type { InventoryRequest, InventoryReview, PurchaseOrder } from "../schemas/inventory.schema";
import { PurchaseOrderFormModal } from "./PurchaseOrderFormModal";
import { PurchaseOrderDetailModal } from "./PurchaseOrderDetailModal";
import { ConfirmDialog } from "@/features/user-management/components/ConfirmDialog";
import { StatusBadge } from "./StatusBadge";
import { fmtQty } from "../lib/inventory";

type EditLine = { key: string; id?: string; itemId: string; quantity: string };

export function InventoryRequestReviewModal({ open, onClose, request, canManage }: {
  open: boolean; onClose: () => void; request: InventoryRequest; canManage: boolean;
}) {
  const query = useInventoryReview(open ? request.id : undefined);
  const items = useInventoryItems(true);
  const me = useMe();
  const save = useSaveInventoryReview();
  const generate = useShortagePurchaseOrder();
  const decide = useInventoryReviewDecision();
  const release = useReleaseInventoryReview();
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [local, setLocal] = useState<InventoryReview | null>(null);
  const [page, setPage] = useState(1);
  const [edited, setEdited] = useState<EditLine[] | null>(null);
  const [dirty, setDirty] = useState(false);
  const [choices, setChoices] = useState<Record<string, boolean>>({});
  const [receiver, setReceiver] = useState("");
  const [note, setNote] = useState("");
  const [rejectUnsourced, setRejectUnsourced] = useState(false);
  const [purchase, setPurchase] = useState<PurchaseOrder | null>(null);
  const [linkedId, setLinkedId] = useState<string | undefined>();
  const linked = useWorkflowPurchaseOrder(linkedId);
  const [error, setError] = useState<string | null>(null);
  const data = local ?? query.data;
  const current = data?.request ?? request;
  const editable = !["FULFILLED", "PARTIALLY_FULFILLED", "REJECTED", "CANCELLED"].includes(current.status)
    && (canManage || (me.data?.role === "SUPERVISOR" && current.requestType === "SITE"));
  const people = useInventoryPeople(current.requestType === "CLEANER" ? "CLEANER" : "SITE", current.siteId ?? undefined,
    current.targetCleanerId ?? undefined, editable);
  const lines = edited ?? current.lines.map(line => ({ key: line.id ?? line.itemId, id: line.id ?? undefined, itemId: line.itemId, quantity: String(line.requestedQuantity) }));
  const remaining = current.lines.flatMap(line => line.allocations.filter(allocation => allocation.status === "RESERVED").map(allocation => ({ line, allocation })));
  const shortage = data?.stock.reduce((sum, row) => sum + row.shortageQuantity, 0) ?? 0;
  const busy = save.isPending || generate.isPending || decide.isPending || release.isPending;
  const activePurchase = purchase ?? linked.data ?? null;

  function updateLine(key: string, patch: Partial<EditLine>) {
    setEdited(value => (value ?? lines).map(line => line.key === key ? { ...line, ...patch } : line)); setDirty(true);
  }

  async function saveLines(nextPage?: number) {
    setError(null);
    if (lines.some(line => !line.itemId || !Number.isFinite(Number(line.quantity)) || Number(line.quantity) <= 0)) {
      setError("Select an item and enter a positive quantity for every line."); return;
    }
    try {
      const result = await save.mutateAsync({ id: current.id, version: current.version, operationKey: crypto.randomUUID(),
        lines: lines.map(line => ({ id: line.id, itemId: line.itemId, quantity: Number(line.quantity) })) });
      setLocal(result); setEdited(null); setDirty(false); setChoices({}); if (nextPage) setPage(nextPage);
    } catch (caught) { setError(getErrorMessage(caught)); }
  }

  async function createPurchase() {
    setError(null);
    try {
      const result = await generate.mutateAsync({ id: current.id, version: current.version, operationKey: crypto.randomUUID() });
      setLocal(result.review); setPurchase(result.purchaseOrder); setEdited(null);
    } catch (caught) { setError(getErrorMessage(caught)); }
  }

  async function finish(rejectAll = false) {
    setError(null);
    try {
      await decide.mutateAsync({ id: current.id, version: current.version, operationKey: crypto.randomUUID(),
        assignedReceiverId: receiver || current.assignedReceiverId || (people.data?.length === 1 ? people.data[0]!.id : undefined),
        note: note || undefined, rejectUnallocated: rejectAll || rejectUnsourced,
        choices: remaining.map(({ allocation }) => ({ allocationId: allocation.id, approve: !rejectAll && (choices[allocation.id] ?? true) })) });
      onClose();
    } catch (caught) { setError(getErrorMessage(caught)); }
  }

  async function releaseReservations() {
    try {
      await release.mutateAsync({ id: current.id, version: current.version, operationKey: crypto.randomUUID() });
      setReleaseOpen(false);
      onClose();
    } catch {
      // Error is shown inside the confirmation dialog.
    }
  }

  return <>
    <Modal open={open} onClose={() => !busy && onClose()} title={`Request - ${current.siteName ?? current.targetCleanerName ?? "Cleaner inventory"}`} maxWidthClassName="max-w-3xl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2"><StatusBadge status={current.status} /><span className="text-sm text-grey-500">{current.source === "CLIENT" ? "Client request" : "Warehouse request"}</span></div>
        <ol className="grid grid-cols-3 gap-2 border-b border-grey-200 pb-3 text-xs sm:text-sm" aria-label="Review progress">
          {["Current inventory", "Edit and source items", "Decide remaining items"].map((label, index) => <li key={label} aria-current={page === index + 1 ? "step" : undefined} className={page === index + 1 ? "font-semibold text-primary" : "text-grey-500"}>{index + 1}. {label}</li>)}
        </ol>
        {query.isLoading && !data ? <LoadingSpinner /> : query.isError ? <p role="alert" className="text-sm text-error">{getErrorMessage(query.error)}</p> : <>
          {page === 1 && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-2">Item</th><th className="py-2 text-right">Requested</th><th className="py-2 text-right">{current.requestType === "CLEANER" ? "Cleaner stock" : "Stock at site"}</th></tr></thead>
            <tbody>{current.lines.map(line => <tr key={line.id ?? line.itemId} className="border-b border-grey-100"><td className="py-3">{line.itemName}</td><td className="py-3 text-right">{fmtQty(line.requestedQuantity)} {line.unit}</td>
              <td className="py-3 text-right">{fmtQty(data?.stock.find(row => row.itemId === line.itemId)?.currentStock ?? 0)} {line.unit}</td></tr>)}</tbody></table></div>}
          {page === 2 && <section className="flex flex-col gap-3">
            {lines.map(line => <div key={line.key} className="grid grid-cols-[minmax(0,1fr)_6rem_2.25rem] items-end gap-2 border-b border-grey-200 pb-3">
              <SearchableSelect label="Item" disabled={!editable || !!line.id} value={line.itemId || null} options={(items.data ?? []).map(item => ({ value: item.id, label: item.name }))} onChange={value => updateLine(line.key, { itemId: value ?? "" })} />
              <TextField label="Quantity" disabled={!editable} type="number" step="0.001" min="0.001" value={line.quantity} onChange={event => updateLine(line.key, { quantity: event.target.value })} />
              {editable && <button type="button" title="Remove item" aria-label="Remove item" onClick={() => { setEdited(value => (value ?? lines).filter(row => row.key !== line.key)); setDirty(true); }} className="flex h-9 w-9 items-center justify-center text-error"><Trash2 size={16} /></button>}
            </div>)}
            {editable && <div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setEdited(value => [...(value ?? lines), { key: crypto.randomUUID(), itemId: "", quantity: "" }]); setDirty(true); }} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><Plus size={16} /> Add item</button>
              <button type="button" disabled={busy} onClick={() => void saveLines()} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><Save size={16} /> Save quantities</button></div>}
            {!dirty && current.reviewStep === 3 && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-2">Item</th>{current.source === "WAREHOUSE" && <><th className="text-right">Warehouse on hand</th><th className="text-right">Warehouse available</th><th className="text-right">Reserved here</th><th className="text-right">Shortage</th></>}<th className="pl-3">Purchase order</th></tr></thead>
              <tbody>{current.lines.map(line => { const row = data?.stock.find(candidate => candidate.lineId === line.id); return <tr key={line.id} className="border-b border-grey-100"><td className="py-3">{line.itemName}</td>{current.source === "WAREHOUSE" && <><td className="text-right">{fmtQty(row?.warehouseStock ?? 0)}</td><td className="text-right">{fmtQty(row?.warehouseAvailable ?? 0)}</td><td className="text-right">{fmtQty(line.allocations.filter(allocation => allocation.source === "WAREHOUSE" && allocation.status !== "CANCELLED").reduce((sum, allocation) => sum + allocation.quantity, 0))}</td><td className="text-right">{fmtQty(row?.shortageQuantity ?? 0)}</td></>}
                <td className="pl-3">{line.allocations.filter(allocation => allocation.source === "PURCHASE_ORDER" && allocation.status !== "CANCELLED").map(allocation => <button type="button" key={allocation.id} className="block text-left text-primary underline" onClick={() => { setPurchase(null); setLinkedId(allocation.purchaseOrderId ?? undefined); }}>Added to PO {allocation.poNumber}: {fmtQty(allocation.quantity)}</button>)}</td></tr>; })}</tbody></table></div>}
            {editable && current.source === "WAREHOUSE" && shortage > 0 && !dirty && current.reviewStep === 3 && <button type="button" disabled={busy} onClick={() => void createPurchase()} className="flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"><FilePlus2 size={16} /> Create shortage draft PO</button>}
          </section>}
          {page === 3 && <section className="flex flex-col gap-3">
            {current.lines.flatMap(line => line.allocations.filter(allocation => allocation.source === "PURCHASE_ORDER" && allocation.status !== "CANCELLED").map(allocation => <p key={allocation.id} className="border-b py-2 text-sm">{line.itemName}: {fmtQty(allocation.quantity)} - Added to PO <button type="button" className="text-primary underline" onClick={() => setLinkedId(allocation.purchaseOrderId ?? undefined)}>{allocation.poNumber}</button></p>))}
            {remaining.map(({ line, allocation }) => <label key={allocation.id} className="flex items-center gap-3 border-b border-grey-100 py-3 text-sm"><input type="checkbox" disabled={!editable} checked={choices[allocation.id] ?? true} onChange={event => setChoices(value => ({ ...value, [allocation.id]: event.target.checked }))} />Approve {line.itemName}: {fmtQty(allocation.quantity)} {line.unit}</label>)}
            {remaining.length === 0 && <p className="text-sm text-grey-500">No warehouse or client quantities awaiting a decision.</p>}
            {editable && remaining.length > 0 && <SearchableSelect label="Receiving person" value={receiver || current.assignedReceiverId || (people.data?.length === 1 ? people.data[0]!.id : null)} loading={people.isLoading}
              options={(people.data ?? []).map(person => ({ value: person.id, label: person.name }))} onChange={value => setReceiver(value ?? "")} />}
            {editable && shortage > 0 && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={rejectUnsourced} onChange={event => setRejectUnsourced(event.target.checked)} />Reject quantities not added to a purchase order</label>}
            {editable && <TextField label="Review note" value={note} onChange={event => setNote(event.target.value)} />}
          </section>}
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2 border-t border-grey-200 pt-3">
            {page > 1 && <button type="button" disabled={busy} onClick={() => setPage(value => value - 1)} className="mr-auto flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><ArrowLeft size={16} />Back</button>}
            {editable && remaining.length > 0 && <button type="button" disabled={busy} onClick={() => { release.reset(); setReleaseOpen(true); }} className="rounded-lg border px-3 py-2 text-sm">Release reservations</button>}
            {page < 3 ? <button type="button" disabled={busy} onClick={() => { if (page === 2 && editable && (dirty || current.reviewStep !== 3)) void saveLines(3); else setPage(value => value + 1); }} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Next<ArrowRight size={16} /></button>
              : editable ? <><button type="button" disabled={busy} onClick={() => void finish(true)} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-error"><X size={16} />Reject remaining</button>
                <button type="button" disabled={busy} onClick={() => void finish()} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"><Check size={16} />{busy ? "Saving..." : remaining.length ? "Confirm decisions" : "Complete review"}</button></> : <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Close</button>}
          </div>
        </>}
      </div>
    </Modal>
    {activePurchase?.status === "DRAFT" ? <PurchaseOrderFormModal open order={activePurchase} onSaved={() => { setLocal(null); void query.refetch(); }} onClose={() => { setPurchase(null); setLinkedId(undefined); }} />
      : <PurchaseOrderDetailModal open={!!activePurchase} order={activePurchase} onClose={() => { setPurchase(null); setLinkedId(undefined); }} />}
    <ConfirmDialog
      open={releaseOpen}
      title="Release reservations"
      description="Release the reserved warehouse quantities and leave this review? Linked purchase orders are kept."
      confirmLabel="Release"
      tone="primary"
      isPending={release.isPending}
      error={release.isError ? getErrorMessage(release.error) : undefined}
      onConfirm={() => void releaseReservations()}
      onClose={() => { if (!release.isPending) setReleaseOpen(false); }}
    />
  </>;
}