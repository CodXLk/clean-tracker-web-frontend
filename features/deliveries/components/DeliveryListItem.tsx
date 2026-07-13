import { Package } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import type { Delivery } from "@/features/deliveries/types";

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

interface DeliveryListItemProps {
  delivery:       Delivery;
  onViewDetails:  () => void;
  onProcess:      () => void;
}

export function DeliveryListItem({ delivery, onViewDetails, onProcess }: DeliveryListItemProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Package size={18} className="text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-on-surface">{delivery.label}</p>
            <p className="text-xs text-grey-500">{delivery.site}</p>
            <p className="text-xs text-grey-500">Requested by {delivery.requestedBy}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={cn("rounded-xl px-2.5 py-1 text-xs", STATUS_CLASSES[delivery.status])}>
            {STATUS_LABEL[delivery.status]}
          </span>
          <PriorityBadge priority={delivery.priority} />
        </div>
      </div>

      <p className="text-xs text-grey-500">
        Items ({delivery.items.length}): {delivery.items.map((i) => i.name).join(", ")}
      </p>

      <div className="flex gap-2 border-t border-grey-100 pt-3">
        {delivery.status === "pending" && (
          <button
            type="button"
            onClick={onProcess}
            className="flex-1 rounded-xl bg-primary py-2 text-xs font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Process Delivery
          </button>
        )}
        {delivery.status === "in_transit" && (
          <button
            type="button"
            onClick={onProcess}
            className="flex-1 rounded-xl bg-primary py-2 text-xs font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Mark as Delivered
          </button>
        )}
        <button
          type="button"
          onClick={onViewDetails}
          className="flex-1 rounded-xl border border-grey-300 py-2 text-xs font-medium text-on-surface transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
