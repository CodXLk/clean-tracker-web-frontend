"use client";

import { useState } from "react";
import { PackageCheck } from "lucide-react";
import { PillButton } from "@/components/shared/PillButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useDeliveries, useConfirmDelivery } from "@/features/inventory/hooks/useInventory";
import { fmtQty } from "@/features/inventory/lib/inventory";

/** Cleaner/supervisor-facing list of warehouse deliveries awaiting a receipt confirmation.
 *  Received quantities are editable per line (enter 0 for items that did not arrive). */
export function CleanerIncomingDeliveries() {
  const { data: deliveries = [], isLoading } = useDeliveries();
  const confirm = useConfirmDelivery();
  // Per-delivery, per-line received quantity overrides (keyed by `${deliveryId}:${lineId}`).
  const [received, setReceived] = useState<Record<string, string>>({});

  const incoming = deliveries.filter((d) => !!d.targetCleanerId && d.status === "DISPATCHED");

  if (isLoading || incoming.length === 0) return null;

  function valueFor(deliveryId: string, lineId: string, fallback: number) {
    const key = `${deliveryId}:${lineId}`;
    return received[key] ?? String(fallback);
  }
  function setValue(deliveryId: string, lineId: string, v: string) {
    setReceived((prev) => ({ ...prev, [`${deliveryId}:${lineId}`]: v }));
  }

  function submit(d: (typeof incoming)[number]) {
    const lines = d.lines.map((l) => ({
      lineId: l.id,
      confirmedQuantity: parseFloat(valueFor(d.id, l.id, l.expectedQuantity)) || 0,
    }));
    confirm.mutate({ id: d.id, lines });
  }

  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-5">
      <div className="mb-3 flex items-center gap-2">
        <PackageCheck size={18} className="text-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-on-surface">Incoming stock — confirm receipt</h2>
      </div>
      <div className="flex flex-col gap-3">
        {incoming.map((d) => (
          <div key={d.id} className="rounded-xl border border-grey-200 bg-white p-3">
            <ul className="mb-3 flex flex-col gap-2">
              {d.lines.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-on-surface">
                    {l.itemName}
                    <span className="ml-1 text-xs text-grey-500">(sent {fmtQty(l.expectedQuantity)} {l.unit})</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={valueFor(d.id, l.id, l.expectedQuantity)}
                      onChange={(e) => setValue(d.id, l.id, e.target.value)}
                      className="w-20 rounded-lg border border-grey-300 px-2 py-1 text-right text-sm"
                      aria-label={`Received quantity for ${l.itemName}`}
                    />
                    <span className="text-xs text-grey-500">{l.unit}</span>
                  </div>
                </li>
              ))}
            </ul>
            <PillButton
              variant="teal"
              className="w-full"
              onClick={() => submit(d)}
              disabled={confirm.isPending}
            >
              {confirm.isPending ? <LoadingSpinner size={16} /> : "Confirm received quantities"}
            </PillButton>
          </div>
        ))}
      </div>
    </section>
  );
}
