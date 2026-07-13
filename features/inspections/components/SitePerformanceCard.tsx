import { Building2 } from "lucide-react";
import type { SitePerformance } from "@/features/inspections/types";

interface SitePerformanceCardProps {
  site: SitePerformance;
}

export function SitePerformanceCard({ site }: SitePerformanceCardProps) {
  return (
    <div className="flex w-[250px] shrink-0 flex-col gap-3 rounded-2xl bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-on-surface">{site.site}</span>
        <Building2 size={16} className="text-grey-500" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-grey-500">Completion</span>
          <span className="text-sm text-primary">{site.completion}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-grey-500">Avg. Time</span>
          <span className="text-sm text-on-surface">{site.avgTime}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-grey-500">Rating</span>
          <span className="text-sm text-[#ED5F25]">{site.rating}/10</span>
        </div>
      </div>
    </div>
  );
}
