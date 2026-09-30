"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { StatusBadge } from "./StatusBadge";
import { AuditLogModal } from "./AuditLogModal";
import { fmtQty, fmtDateTime } from "@/features/inventory/lib/inventory";
import type { InventoryDelivery } from "@/features/inventory/schemas/inventory.schema";

interface DeliveryDetailModalProps {
  open: boolean;
  onClose: () => void;
  delivery: InventoryDelivery | null;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-grey-500">{label}</span>
      <span className="text-sm font-medium text-on-surface">{value}</span>
    </div>
  );
}

export function DeliveryDetailModal({ open, onClose, delivery }: DeliveryDetailModalProps) {
  const [auditOpen, setAuditOpen] = useState(false);
  if (!delivery) return null;

  const dest = delivery.siteName ?? (delivery.targetCleanerId ? "Cleaner inventory" : "—");
  const showConfirmed = delivery.status === "RECEIVED" || delivery.status === "PENDING_APPROVAL";

  return (
    <Modal open={open} onClose={onClose} title={`Delivery · ${dest}`}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={delivery.status} />
            <span className="text-xs text-grey-500">Raised {fmtDateTime(delivery.createdAt)}</span>
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
          <Field label="Destination" value={dest} />
          <Field label="Dispatched by" value={delivery.dispatchedByName ?? "—"} />
          <Field label="Dispatched at" value={delivery.dispatchedAt ? fmtDateTime(delivery.dispatchedAt) : "—"} />
          <Field label="Confirmed by" value={delivery.confirmedByName ?? "—"} />
        </div>

        <div className="overflow-hidden rounded-xl border border-grey-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-grey-50 text-xs uppercase text-grey-500">
              <tr>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2 text-right">Sent</th>
                {showConfirmed && <th className="px-3 py-2 text-right">Received</th>}
              </tr>
            </thead>
            <tbody>
              {delivery.lines.map((l) => (
                <tr key={l.id} className="border-t border-grey-100">
                  <td className="px-3 py-2 text-on-surface">{l.itemName}</td>
                  <td className="px-3 py-2 text-right">{fmtQty(l.expectedQuantity)} {l.unit}</td>
                  {showConfirmed && (
                    <td className="px-3 py-2 text-right">
                      {l.confirmedQuantity != null ? `${fmtQty(l.confirmedQuantity)} ${l.unit}` : "—"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {delivery.note && (
          <div className="rounded-xl bg-grey-50 px-3 py-2 text-sm text-on-surface-variant">
            <span className="text-xs text-grey-500">Note</span>
            <p className="mt-0.5">{delivery.note}</p>
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
        refType="DELIVERY"
        refId={delivery.id}
        title="Delivery audit log"
      />
    </Modal>
  );
}
