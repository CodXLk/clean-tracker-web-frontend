import { cn } from "@/lib/utils/cn";
import { ProgressBar } from "@/components/shared/ProgressBar";
import type { InventoryItem } from "@/features/deliveries/types";

const LEVEL_LABEL: Record<InventoryItem["level"], string> = {
  good:   "Good",
  medium: "Medium",
  low:    "Low",
};

const LEVEL_CLASSES: Record<InventoryItem["level"], string> = {
  good:   "bg-success/10 text-success",
  medium: "bg-[#ED5F25]/10 text-[#ED5F25]",
  low:    "bg-danger/10 text-danger",
};

const LEVEL_BAR_CLASSES: Record<InventoryItem["level"], string> = {
  good:   "bg-success",
  medium: "bg-[#ED5F25]",
  low:    "bg-danger",
};

interface InventoryItemRowProps {
  item: InventoryItem;
}

export function InventoryItemRow({ item }: InventoryItemRowProps) {
  const percent = Math.round((item.stock / item.capacity) * 100);

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-on-surface">{item.name}</span>
        <span className={cn("shrink-0 rounded-xl px-2 py-0.5 text-xs", LEVEL_CLASSES[item.level])}>
          {LEVEL_LABEL[item.level]}
        </span>
      </div>
      <ProgressBar percent={percent} barClassName={LEVEL_BAR_CLASSES[item.level]} />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-grey-500">
          {item.stock} / {item.capacity} {item.unit}
        </span>
        <span className="text-xs text-grey-500">{item.site}</span>
      </div>
    </div>
  );
}
