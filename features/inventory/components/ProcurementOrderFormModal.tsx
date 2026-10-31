"use client";

import { useRef, useState } from "react";
import { MessageSquare, Plus, Save, Trash2 } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { SearchableSelect } from "@/features/user-management/components/SearchableSelect";
import { ConfirmDialog } from "@/features/user-management/components/ConfirmDialog";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useCleaners } from "@/features/cleaners/hooks/useCleaners";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useInventoryItems, useSiteInventory, useCleanerInventory } from "../hooks/useInventory";
import { useInventoryPeople, useSaveProcurementOrder } from "../hooks/useInventoryWorkflow";
import { useDeletePurchaseOrderDraft, type PurchaseOrderDraft } from "../hooks/usePurchaseOrderDrafts";
import { LegacyPurchaseDraftPayloadSchema, type PurchaseOrder, type PurchaseOrderType, type ProcurementMethod } from "../schemas/inventory.schema";

type Line = { key: string; id?: string; itemId: string; quantity: string; supplierId: string; note: string; unitCost?: number };

export function ProcurementOrderFormModal({ open, onClose, order, draft, onSaved }: {
  open: boolean; onClose: () => void; order?: PurchaseOrder | null; draft?: PurchaseOrderDraft | null;
  onSaved?: (order: PurchaseOrder) => void;
}) {
  const legacyResult = LegacyPurchaseDraftPayloadSchema.safeParse(draft?.payload);
  const legacy = legacyResult.success ? legacyResult.data : {};
  const [orderType, setOrderType] = useState<PurchaseOrderType | "">(order?.orderType ?? (draft ? "WAREHOUSE" : ""));
  const [method, setMethod] = useState<ProcurementMethod>(order?.procurementMethod ?? "SUPPLIER_DELIVERY");
  const [siteId, setSiteId] = useState(order?.siteId ?? "");
  const [cleanerId, setCleanerId] = useState(order?.cleanerId ?? "");
  const [receiver, setReceiver] = useState(order?.assignedReceiverId ?? "");
  const [carrier, setCarrier] = useState(order?.handCarryPersonId ?? "");
  const [expectedDate, setExpectedDate] = useState(order?.expectedDate ?? legacy.expectedDate ?? "");
  const [address, setAddress] = useState(order?.deliveryAddress ?? legacy.deliveryAddress ?? "");
  const [saved, setSaved] = useState<PurchaseOrder | null>(null);
  const [editedLines, setEditedLines] = useState<Line[] | null>(() => order ? order.lines.map(line => ({
    key: line.id, id: line.id, itemId: line.itemId, quantity: String(line.quantity), supplierId: line.supplierId ?? "", note: line.note ?? "", unitCost: line.unitCost ?? undefined,
  })) : legacy.lines ? legacy.lines.map(line => ({ key: crypto.randomUUID(), itemId: line.itemId, quantity: String(line.quantity), supplierId: line.supplierId ?? legacy.supplierId ?? "", note: line.note ?? "" })) : null);
  const [note, setNote] = useState<{ key: string; value: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingContext, setPendingContext] = useState<(() => void) | null>(null);
  const operation = useRef(crypto.randomUUID());
  const items = useInventoryItems(true);
  const sites = useSites();
  const cleaners = useCleaners();
  const siteStock = useSiteInventory(orderType === "SITE" ? siteId || undefined : undefined);
  const cleanerStock = useCleanerInventory(orderType === "CLEANER" ? cleanerId || undefined : undefined);
  const people = useInventoryPeople(orderType || "WAREHOUSE", siteId || undefined, cleanerId || undefined, !!orderType);
  const save = useSaveProcurementOrder();
  const deleteLegacy = useDeletePurchaseOrderDraft();
  const destinationReady = !!orderType && (orderType === "WAREHOUSE" || (orderType === "SITE" ? !!siteId : !!cleanerId));
  const stockRows = orderType === "WAREHOUSE" ? (items.data ?? []).map(item => ({ itemId: item.id, quantity: item.mainStockQuantity, minStock: item.minStock }))
    : orderType === "SITE" ? siteStock.data ?? [] : cleanerStock.data?.items ?? [];
  const suggestions: Line[] = destinationReady ? stockRows.filter(row => row.minStock != null && row.minStock > 0 && row.quantity < row.minStock).map(row => {
    const item = items.data?.find(candidate => candidate.id === row.itemId);
    return { key: row.itemId, itemId: row.itemId, quantity: String(row.minStock), supplierId: item?.supplierId ?? "", note: "" };
  }) : [];
  const lines = editedLines ?? suggestions;
  const selectedReceiver = receiver || (people.data?.length === 1 ? people.data[0]!.id : "");
  const selectedCarrier = carrier || (people.data?.length === 1 ? people.data[0]!.id : "");
  const contextLoading = items.isLoading || (orderType === "SITE" ? siteStock.isLoading : orderType === "CLEANER" ? cleanerStock.isLoading : false);
  const busy = save.isPending || deleteLegacy.isPending;

  function applyContext(change: () => void) {
    change(); setEditedLines(null); setReceiver(""); setCarrier("");
  }

  function changeContext(change: () => void) {
    if (order?.id) return;
    if (editedLines?.length) { setPendingContext(() => change); return; }
    applyContext(change);
  }

  function updateLine(key: string, patch: Partial<Line>) {
    setEditedLines(current => (current ?? suggestions).map(line => line.key === key ? { ...line, ...patch } : line));
  }

  async function submit() {
    if (busy) return;
    setError(null);
    if (!destinationReady || !orderType) { setError("Select the purchase order type and destination."); return; }
    const selected = lines.filter(line => line.itemId);
    if (selected.some(line => !Number.isFinite(Number(line.quantity)) || Number(line.quantity) <= 0)) { setError("Enter a positive quantity for every selected item."); return; }
    if (new Set(selected.map(line => line.itemId)).size !== selected.length) { setError("Each item can appear only once."); return; }
    try {
      const result = await save.mutateAsync({ id: saved?.id ?? order?.id, input: {
        orderType, procurementMethod: method, siteId: orderType === "SITE" ? siteId : undefined,
        cleanerId: orderType === "CLEANER" ? cleanerId : undefined,
        expectedDate: expectedDate || undefined, deliveryAddress: address.trim() || undefined,
        assignedReceiverId: selectedReceiver || undefined, handCarryPersonId: method === "HAND_CARRY" ? selectedCarrier || undefined : undefined,
        version: saved?.version ?? order?.version, draft: true, operationKey: operation.current,
        legacyDraftId: !saved?.id && !order?.id ? draft?.id : undefined,
        lines: selected.map(line => ({ id: line.id, itemId: line.itemId, quantity: Number(line.quantity), supplierId: line.supplierId || undefined, note: line.note || undefined, unitCost: line.unitCost })),
      } });
      setSaved(result);
      setEditedLines(result.lines.map(line => ({ key: line.id, id: line.id, itemId: line.itemId, quantity: String(line.quantity), supplierId: line.supplierId ?? "", note: line.note ?? "", unitCost: line.unitCost ?? undefined })));
      if (draft?.id) await deleteLegacy.mutateAsync(draft.id);
      onSaved?.(result); onClose();
    } catch (caught) { setError(getErrorMessage(caught)); }
  }

  return <>
    <Modal open={open} onClose={() => !busy && onClose()} title={order ? `Edit ${order.poNumber}` : "New purchase order"} maxWidthClassName="max-w-3xl">
      <form onSubmit={event => { event.preventDefault(); void submit(); }} className="flex flex-col gap-4">
        <SearchableSelect label="Purchase order type" required value={orderType || null} disabled={!!order}
          options={[{ value: "WAREHOUSE", label: "Warehouse" }, { value: "SITE", label: "Site Inventory" }, { value: "CLEANER", label: "Cleaner Inventory" }]}
          onChange={value => changeContext(() => setOrderType((value ?? "") as PurchaseOrderType | ""))} />
        {orderType === "SITE" && <SearchableSelect label="Site" required value={siteId || null} disabled={!!order} loading={sites.isLoading}
          options={(sites.data ?? []).map(site => ({ value: site.id, label: site.name }))} onChange={value => changeContext(() => setSiteId(value ?? ""))} />}
        {orderType === "CLEANER" && <SearchableSelect label="Cleaner" required value={cleanerId || null} disabled={!!order} loading={cleaners.isLoading}
          options={(cleaners.data ?? []).map(cleaner => ({ value: cleaner.id, label: `${cleaner.firstName} ${cleaner.lastName ?? ""}`.trim() }))} onChange={value => changeContext(() => setCleanerId(value ?? ""))} />}
        <fieldset className="flex flex-col gap-2"><legend className="mb-2 text-sm font-medium">Procurement method</legend>
          <SegmentedTabs options={["Supplier Delivery", "Hand Carry"] as const} value={method === "HAND_CARRY" ? "Hand Carry" : "Supplier Delivery"}
            onChange={value => setMethod(value === "Hand Carry" ? "HAND_CARRY" : "SUPPLIER_DELIVERY")} />
        </fieldset>
        <section className="flex flex-col gap-3"><h3 className="text-sm font-semibold">Items</h3>
          {contextLoading ? <LoadingSpinner /> : lines.length === 0 ? <p className="text-sm text-grey-500">No low-stock items.</p> : lines.map(line => {
            const item = items.data?.find(candidate => candidate.id === line.itemId);
            const suppliers = item?.suppliers.length ? item.suppliers : item?.supplierId ? [{ id: item.supplierId, name: item.supplierName ?? "Supplier", active: true }] : [];
            return <div key={line.key} className="grid grid-cols-[minmax(0,1fr)_5rem_2.25rem_2.25rem] items-end gap-2 border-b border-grey-200 pb-3 sm:grid-cols-[minmax(0,1.2fr)_6rem_minmax(0,1fr)_2.25rem_2.25rem]">
              <SearchableSelect label="Item" value={line.itemId || null} options={(items.data ?? []).map(option => ({ value: option.id, label: option.name }))}
                onChange={value => { const next = items.data?.find(option => option.id === value); updateLine(line.key, { itemId: value ?? "", supplierId: next?.supplierId ?? "" }); }} />
              <TextField label={item?.unit ?? "Quantity"} type="number" min="0.001" step="0.001" value={line.quantity} onChange={event => updateLine(line.key, { quantity: event.target.value })} />
              <div className="col-span-full row-start-2 sm:col-auto sm:row-auto"><SearchableSelect label="Supplier" value={line.supplierId || null}
                options={suppliers.filter(supplier => supplier.active).map(supplier => ({ value: supplier.id, label: supplier.name }))} onChange={value => updateLine(line.key, { supplierId: value ?? "" })} /></div>
              <button type="button" title="Item note" aria-label={`Note for ${item?.name ?? "item"}`} onClick={() => setNote({ key: line.key, value: line.note })}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border ${line.note ? "border-primary text-primary" : "border-grey-300 text-grey-500"}`}><MessageSquare size={16} /></button>
              <button type="button" title="Remove item" aria-label="Remove item" onClick={() => setEditedLines(current => (current ?? suggestions).filter(candidate => candidate.key !== line.key))}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-error"><Trash2 size={16} /></button>
            </div>;
          })}
          <button type="button" disabled={!destinationReady || contextLoading} onClick={() => setEditedLines(current => [...(current ?? suggestions), { key: crypto.randomUUID(), itemId: "", quantity: "", supplierId: "", note: "" }])}
            className="flex items-center gap-2 self-start rounded-lg border border-grey-300 px-3 py-2 text-sm disabled:opacity-50"><Plus size={16} /> Add item</button>
        </section>
        <div className="grid gap-3 sm:grid-cols-2"><TextField label="Expected date" type="date" value={expectedDate} onChange={event => setExpectedDate(event.target.value)} />
          <TextField label="Destination address" value={address} onChange={event => setAddress(event.target.value)} /></div>
        <div className="grid gap-3 sm:grid-cols-2"><SearchableSelect label="Receiving person" value={selectedReceiver || null} loading={people.isLoading}
          options={(people.data ?? []).map(person => ({ value: person.id, label: person.name }))} onChange={value => setReceiver(value ?? "")} />
          {method === "HAND_CARRY" && <SearchableSelect label="Hand-carry person" value={selectedCarrier || null} loading={people.isLoading}
            options={(people.data ?? []).map(person => ({ value: person.id, label: person.name }))} onChange={value => setCarrier(value ?? "")} />}</div>
        {legacy.note && <p className="text-sm text-grey-500">Legacy note: {legacy.note}</p>}
        {(error || people.isError) && <p role="alert" className="text-sm text-error">{error ?? getErrorMessage(people.error)}</p>}
        <div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={busy || contextLoading} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Save size={16} />{busy ? "Saving..." : "Save draft"}</button></div>
      </form>
    </Modal>
    <Modal open={!!note} onClose={() => setNote(null)} title="Item note" maxWidthClassName="max-w-md">
      <label className="flex flex-col gap-2 text-sm">Note<textarea maxLength={1024} rows={5} value={note?.value ?? ""} onChange={event => setNote(current => current ? { ...current, value: event.target.value } : null)} className="rounded-lg border border-grey-300 p-3" /></label>
      <button type="button" className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={() => { if (note) updateLine(note.key, { note: note.value }); setNote(null); }}>Save note</button>
    </Modal>
    <ConfirmDialog
      open={!!pendingContext}
      title="Change destination"
      description="Changing the type or destination replaces the current item list with that destination's low-stock items. Continue?"
      confirmLabel="Replace items"
      tone="primary"
      onConfirm={() => { if (pendingContext) applyContext(pendingContext); setPendingContext(null); }}
      onClose={() => setPendingContext(null)}
    />
  </>;
}