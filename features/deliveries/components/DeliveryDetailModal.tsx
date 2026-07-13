"use client";

import { useCallback, useEffect } from "react";
import { X, Package } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import type { Delivery } from "@/features/deliveries/types";

interface DeliveryDetailModalProps {
  open:     boolean;
  onClose:  () => void;
  delivery: Delivery | null;
  onProcess: (delivery: Delivery) => void;
}

const STATUS_LABEL: Record<Delivery["status"], string> = {
  pending:    "Pending",
  in_transit: "In Transit",
  delivered:  "Delivered",
};

const STATUS_CLASSES: Record<Delivery["status"], string> = {
  pending:    "bg-[#ED5F25]/10 text-[#ED5F25]",
  in_transit: "bg-primary/10 text-primary",
  delivered:  "bg-success/10 text-success",
};

export function DeliveryDetailModal({ open, onClose, delivery, onProcess }: DeliveryDetailModalProps) {
  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  if (!open || !delivery) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delivery-detail-title"
    >
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-surface shadow-2xl">
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Package size={24} className="text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 id="delivery-detail-title" className="text-lg font-medium text-on-surface">
                {delivery.label}
              </h2>
              <p className="text-sm text-grey-500">{delivery.site}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={handleClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 pb-2">
          <div className="mb-4 flex items-center gap-2">
            <span className={cn("rounded-xl px-2.5 py-1 text-xs", STATUS_CLASSES[delivery.status])}>
              {STATUS_LABEL[delivery.status]}
            </span>
            <PriorityBadge priority={delivery.priority} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-grey-500">Requested By</p>
              <p className="mt-1 text-sm text-on-surface">{delivery.requestedBy}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-grey-500">Date &amp; Time</p>
              <p className="mt-1 text-sm text-on-surface">{delivery.requestedAt}</p>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-medium text-grey-500">Items</p>
            <div className="flex flex-col gap-2">
              {delivery.items.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-xl bg-grey-100 px-4 py-3"
                >
                  <span className="text-sm text-on-surface">{item.name}</span>
                  <span className="text-sm text-grey-500">
                    {item.deliveredQty ?? item.requestedQty} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-4">
          {delivery.status !== "delivered" ? (
            <button
              type="button"
              onClick={() => onProcess(delivery)}
              className="h-11 w-full rounded-xl bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Process Delivery
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="h-11 w-full rounded-xl border border-grey-300 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
