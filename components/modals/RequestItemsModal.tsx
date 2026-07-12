"use client";

import { useState } from "react";
import { Minus, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SlideButton } from "@/components/shared/SlideButton";

interface RequestItemsModalProps {
  open:     boolean;
  onClose:  () => void;
}

interface InventoryItem {
  id:    string;
  name:  string;
  stock: number;
}

const INVENTORY_ITEMS: InventoryItem[] = [
  { id: "1", name: "Floor Cleaner",      stock: 10 },
  { id: "2", name: "Disinfectant Spray", stock: 4  },
  { id: "3", name: "Hand Sanitizer",     stock: 4  },
  { id: "4", name: "Trash Bags",         stock: 20 },
];

export function RequestItemsModal({ open, onClose }: RequestItemsModalProps) {
  const [search,     setSearch]     = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  if (!open) return null;

  const filtered = INVENTORY_ITEMS.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedItems = INVENTORY_ITEMS.filter((item) => (quantities[item.id] ?? 0) > 0);

  function addItem(id: string) {
    setQuantities((prev) => ({ ...prev, [id]: 1 }));
  }

  function increment(id: string) {
    setQuantities((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }

  function decrement(id: string) {
    setQuantities((prev) => {
      const next = (prev[id] ?? 0) - 1;
      if (next <= 0) {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      }
      return { ...prev, [id]: next };
    });
  }

  function handleSubmit() {
    onClose();
    setQuantities({});
    setSearch("");
  }

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
        aria-label="Request items"
        className={cn(
          "fixed z-50 bg-white p-6",
          "inset-x-0 bottom-0 rounded-t-3xl max-h-[85vh] overflow-y-auto",
          "lg:inset-0 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-md lg:rounded-3xl lg:shadow-2xl",
        )}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface">Request Items</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-0.5 text-danger transition-colors hover:bg-danger/10"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Search */}
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-grey-100 px-3 py-2">
          <Search size={16} className="shrink-0 text-grey-500" />
          <input
            type="text"
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-grey-500 outline-none"
          />
        </div>

        {/* Item list */}
        <div className="mb-5 flex flex-col gap-2">
          {filtered.map((item) => {
            const qty = quantities[item.id] ?? 0;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-on-surface truncate">
                    {item.name}
                  </span>
                  <span className="shrink-0 rounded-full bg-grey-100 px-2.5 py-0.5 text-xs text-grey-700">
                    {item.stock} in stock
                  </span>
                </div>
                {qty === 0 ? (
                  <button
                    onClick={() => addItem(item.id)}
                    className="shrink-0 rounded-xl border border-primary px-3 py-1 text-sm text-primary transition-colors hover:bg-primary/10"
                  >
                    + Add
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decrement(item.id)}
                      aria-label={`Remove one ${item.name}`}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"
                    >
                      <Minus size={12} strokeWidth={2.5} />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                    <button
                      onClick={() => increment(item.id)}
                      aria-label={`Add one ${item.name}`}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"
                    >
                      <Plus size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected items */}
        {selectedItems.length > 0 && (
          <>
            <hr className="mb-4 border-grey-300" />
            <h3 className="mb-3 text-sm font-semibold text-grey-700">Selected Items</h3>
            <div className="mb-5 flex flex-col gap-2">
              {selectedItems.map((item) => {
                const qty = quantities[item.id] ?? 0;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-grey-100 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-on-surface">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decrement(item.id)}
                        aria-label={`Remove one ${item.name}`}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"
                      >
                        <Minus size={12} strokeWidth={2.5} />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                      <button
                        onClick={() => increment(item.id)}
                        aria-label={`Add one ${item.name}`}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"
                      >
                        <Plus size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Submit */}
        <SlideButton
          label="Submit Request"
          variant="teal"
          onComplete={handleSubmit}
          disabled={selectedItems.length === 0}
        />

        <p className="mt-3 text-center text-xs text-grey-500">
          Requests will be reviewed by your supervisor.
        </p>
      </div>
    </>
  );
}
