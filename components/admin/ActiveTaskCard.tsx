import { cn } from "@/lib/utils/cn";

interface CleanerInfo {
  initials: string;
  name: string;
  gradientFrom: string;
  gradientTo: string;
}

interface ActiveTaskCardProps {
  cleaner: CleanerInfo;
  site: string;
  area: string;
  time: string;
  category: string;
  priority: "high" | "medium" | "low";
  status: "Active" | "Scheduled" | "In Progress";
}

export function ActiveTaskCard({
  cleaner,
  site,
  area,
  time,
  category,
  priority,
  status,
}: ActiveTaskCardProps) {
  return (
    <div className="w-[220px] shrink-0 rounded-2xl bg-surface p-4 shadow-sm">
      {/* Cleaner info */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
          style={{
            background: `linear-gradient(135deg, ${cleaner.gradientFrom}, ${cleaner.gradientTo})`,
          }}
          aria-hidden="true"
        >
          {cleaner.initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-on-surface">{cleaner.name}</p>
          <p className="truncate text-xs text-grey-500">{site}</p>
        </div>
      </div>

      {/* Area */}
      <p className="mt-2 truncate text-xs text-grey-500">{area}</p>

      {/* Time + category */}
      <div className="mt-1 flex items-center gap-2">
        <span className="text-xs text-grey-500">{time}</span>
        <span className="text-xs text-grey-500">·</span>
        <span className="truncate text-xs text-grey-500">{category}</span>
      </div>

      {/* Badges */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs",
            priority === "high" && "border border-red-200 bg-red-50 text-danger",
            priority === "medium" && "border border-orange-200 bg-orange-50 text-[#ED5F25]",
            priority === "low" && "bg-grey-100 text-grey-700",
          )}
        >
          {priority.charAt(0).toUpperCase() + priority.slice(1)}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs",
            status === "Active" && "bg-success/10 text-success",
            status === "Scheduled" && "bg-primary/10 text-primary",
            status === "In Progress" && "bg-[#ED5F25]/10 text-[#ED5F25]",
          )}
        >
          {status}
        </span>
      </div>
    </div>
  );
}
