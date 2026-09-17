"use client";

import { PackageCheck } from "lucide-react";
import { PillButton } from "@/components/shared/PillButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useDeliveries, useConfirmDelivery } from "@/features/inventory/hooks/useInventory";
import { fmtQty } from "@/features/inventory/lib/inventory";

/** Cleaner-facing list of warehouse deliveries heading to the cleaner's own inventory,
 *  awaiting a receipt confirmation. Confirming accepts the dispatched quantities. */
export function CleanerIncomingDeliveries() {
  const { data: deliveries = [], isLoading } = useDeliveries();
  const confirm = useConfirmDelivery();

  const incoming = deliveries.filter(
    (d) => !!d.targetCleanerId && d.status === "DISPATCHED",
  );

  if (isLoading || incoming.length === 0) return null;

  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-5">
      <div className="mb-3 flex items-center gap-2">
        <PackageCheck size={18} className="text-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-on-surface">Incoming stock — confirm receipt</h2>
      </div>
      <div className="flex flex-col gap-3">
        {incoming.map((d) => (
          <div key={d.id} className="rounded-xl border border-grey-200 bg-white p-3">
            <ul className="mb-3 flex flex-col gap-1">
              {d.lines.map((l) => (
                <li key={l.id} className="flex items-center justify-between text-sm">
                  <span className="text-on-surface">{l.itemName}</span>
                  <span className="font-medium text-grey-700">
                    {fmtQty(l.expectedQuantity)} {l.unit}
                  </span>
                </li>
              ))}
            </ul>
            <PillButton
              variant="teal"
              className="w-full"
              onClick={() => confirm.mutate({ id: d.id, lines: [] })}
              disabled={confirm.isPending}
            >
              {confirm.isPending ? (
                <LoadingSpinner size={16} />
              ) : (
                "Confirm receipt"
              )}
            </PillButton>
          </div>
        ))}
      </div>
    </section>
  );
}
