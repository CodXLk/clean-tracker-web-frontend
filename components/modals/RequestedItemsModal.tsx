"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RequestedItem {
  name:     string;
  quantity: number;
}

interface RequestedItemsModalProps {
  open:     boolean;
  onClose:  () => void;
  items:    RequestedItem[];
}

export function RequestedItemsModal({ open, onClose, items }: RequestedItemsModalProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Requested items"
        className={cn(
          "fixed z-50 bg-white p-6",
          "inset-x-0 bottom-0 rounded-t-3xl",
          "lg:inset-0 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-md lg:rounded-3xl lg:shadow-2xl",
        )}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface">Requested Items</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-0.5 text-danger transition-colors hover:bg-danger/10"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Items list */}
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-grey-500">No items requested.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl bg-[#E8F5F5] px-4 py-3"
              >
                <span className="text-sm font-medium text-on-surface">{item.name}</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                  {item.quantity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
