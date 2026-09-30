"use client";

import { Modal } from "@/components/shared/Modal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useInventoryEvents } from "@/features/inventory/hooks/useInventory";
import { INVENTORY_EVENT_TYPE_LABELS, type InventoryEventType } from "@/features/inventory/schemas/inventory.schema";
import { fmtDateTime } from "@/features/inventory/lib/inventory";

interface AuditLogModalProps {
  open: boolean;
  onClose: () => void;
  refType: "REQUEST" | "DELIVERY" | "PO";
  refId: string | null;
  title?: string;
}

function label(type: string) {
  return INVENTORY_EVENT_TYPE_LABELS[type as InventoryEventType] ?? type;
}

export function AuditLogModal({ open, onClose, refType, refId, title }: AuditLogModalProps) {
  const { data: events = [], isLoading } = useInventoryEvents(
    open && refId ? { refType, refId } : {},
  );

  return (
    <Modal open={open} onClose={onClose} title={title ?? "Audit log"}>
      {isLoading ? (
        <div className="flex justify-center py-8"><LoadingSpinner size={24} /></div>
      ) : events.length === 0 ? (
        <p className="py-6 text-center text-sm text-grey-500">No history recorded yet.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {events.map((e) => (
            <li key={e.id} className="flex gap-3">
              <div className="mt-1 flex flex-col items-center">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="mt-1 w-px flex-1 bg-grey-200" />
              </div>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-on-surface">{label(e.eventType)}</span>
                  <span className="text-xs text-grey-500">{fmtDateTime(e.performedAt)}</span>
                </div>
                {e.message && <p className="text-sm text-on-surface-variant">{e.message}</p>}
                <p className="text-xs text-grey-500">by {e.performedByName ?? "System"}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
      <button
        type="button"
        onClick={onClose}
        className="mt-4 h-11 w-full rounded-full border border-grey-300 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100"
      >
        Close
      </button>
    </Modal>
  );
}
