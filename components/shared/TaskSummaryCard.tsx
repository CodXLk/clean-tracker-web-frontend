import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import type { Priority } from "@/components/shared/PriorityBadge";

export type TaskSummaryStatus = "pending" | "in_progress" | "completed" | "scheduled";

const STATUS_LABEL: Record<TaskSummaryStatus, string> = {
  pending:     "Pending",
  in_progress: "In Progress",
  completed:   "Completed",
  scheduled:   "Scheduled",
};

const STATUS_TEXT_CLASSES: Record<TaskSummaryStatus, string> = {
  pending:     "text-[#ED5F25]",
  in_progress: "text-primary",
  completed:   "text-success",
  scheduled:   "text-grey-700",
};

const ICON_BOX_CLASSES: Record<Priority, string> = {
  high:   "bg-gradient-to-br from-red-100 to-red-50 border-red-200 text-danger",
  medium: "bg-gradient-to-br from-orange-100 to-orange-50 border-orange-200 text-[#ED5F25]",
  low:    "bg-gradient-to-br from-grey-300/60 to-grey-100 border-grey-300 text-grey-700",
};

interface TaskSummaryCardProps {
  title:      string;
  category:   string;
  priority:   Priority;
  status:     TaskSummaryStatus;
  dueLabel:   string;
  icon:       LucideIcon;
  onClick?:   () => void;
  className?: string;
}

export function TaskSummaryCard({
  title,
  category,
  priority,
  status,
  dueLabel,
  icon: Icon,
  onClick,
  className,
}: TaskSummaryCardProps) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border border-white/20 bg-white/60 p-5 text-left shadow-sm transition-shadow",
        onClick && "cursor-pointer hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium leading-tight text-[#1A1A1A]">{title}</span>
            <PriorityBadge priority={priority} />
          </div>
          <span className="text-xs text-grey-500">{category}</span>
        </div>

        <span
          className={cn(
            "flex size-[38px] shrink-0 items-center justify-center rounded-2xl border shadow-sm",
            ICON_BOX_CLASSES[priority],
          )}
          aria-hidden="true"
        >
          <Icon size={20} strokeWidth={2} />
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className={cn("text-xs font-medium", STATUS_TEXT_CLASSES[status])}>
          {STATUS_LABEL[status]}
        </span>
        <span className="text-xs font-medium text-primary">{dueLabel}</span>
      </div>
    </Wrapper>
  );
}
