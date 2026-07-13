import { MapPin } from "lucide-react";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import type { AreaInspection } from "@/features/inspections/types";

interface AreaInspectionCardProps {
  area:    AreaInspection;
  onClick: () => void;
}

export function AreaInspectionCard({ area, onClick }: AreaInspectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[200px] shrink-0 flex-col gap-2 rounded-2xl bg-surface p-3 text-left shadow-sm transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex items-center gap-1.5">
        <MapPin size={16} className="shrink-0 text-primary" aria-hidden="true" />
        <span className="truncate text-xs font-medium text-on-surface">{area.site}</span>
      </div>
      <p className="text-sm text-on-surface">{area.area}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-grey-500">{area.reportedAgo}</span>
        <PriorityBadge priority={area.priority} />
      </div>
    </button>
  );
}
