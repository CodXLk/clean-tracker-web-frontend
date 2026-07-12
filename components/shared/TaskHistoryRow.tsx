import { cn } from "@/lib/utils/cn";

interface TaskHistoryRowProps {
  title:    string;
  category: string;
  status:   "completed" | "pending";
  time:     string;
  className?: string;
}

export function TaskHistoryRow({
  title,
  category,
  status,
  time,
  className,
}: TaskHistoryRowProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl p-4 shadow-sm flex items-start justify-between gap-3",
        className,
      )}
    >
      {/* Left: text info */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium text-[#1A1A1A] leading-snug truncate">
          {title}
        </span>
        <span className="text-xs text-grey-500">{category}</span>
        <span className="text-xs text-primary">{time}</span>
      </div>

      {/* Right: status badge */}
      <span
        className={cn(
          "shrink-0 px-2 py-0.5 rounded-xl text-xs font-medium",
          status === "completed"
            ? "bg-success/20 text-success"
            : "bg-[#ED5F25]/20 text-[#ED5F25]",
        )}
      >
        {status === "completed" ? "Completed" : "Pending"}
      </span>
    </div>
  );
}
