import { cn } from "@/lib/utils/cn";

export type Priority = "high" | "medium" | "low";

const PRIORITY_CLASSES: Record<Priority, string> = {
  high:   "bg-red-50 border border-red-200 text-danger",
  medium: "bg-orange-50 border border-orange-200 text-[#ED5F25]",
  low:    "bg-grey-100 border border-grey-300 text-grey-700",
};

interface PriorityBadgeProps {
  priority:   Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        "px-2.5 py-0.5 rounded-xl text-xs font-medium capitalize",
        PRIORITY_CLASSES[priority],
        className,
      )}
    >
      {priority}
    </span>
  );
}
