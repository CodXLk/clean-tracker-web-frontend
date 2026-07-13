import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import type { Complaint } from "@/features/complaints/types";

const STATUS_LABEL: Record<Complaint["status"], string> = {
  open:        "Open",
  in_progress: "In Progress",
  resolved:    "Resolved",
  closed:      "Closed",
};

const STATUS_CLASSES: Record<Complaint["status"], string> = {
  open:        "bg-[#ED5F25]/10 text-[#ED5F25]",
  in_progress: "bg-primary/10 text-primary",
  resolved:    "bg-success/10 text-success",
  closed:      "bg-grey-100 text-grey-700",
};

interface ComplaintRowProps {
  complaint: Complaint;
  onClick:   () => void;
}

export function ComplaintRow({ complaint, onClick }: ComplaintRowProps) {
  const isClosed = complaint.status === "closed";

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-2xl bg-surface p-5 shadow-sm sm:w-[calc(50%-0.5rem)]",
        isClosed && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ED5F25]/10">
            <MessageSquare size={18} className="text-[#ED5F25]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-on-surface">{complaint.title}</p>
              <span className="shrink-0 rounded-full bg-grey-100 px-2 py-0.5 text-xs text-grey-700">
                {complaint.code}
              </span>
            </div>
            <p className="text-xs text-grey-500">{complaint.floor}</p>
            <p className="text-xs text-grey-500">{complaint.site}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={cn("rounded-xl px-2.5 py-1 text-xs", STATUS_CLASSES[complaint.status])}>
            {STATUS_LABEL[complaint.status]}
          </span>
          <PriorityBadge priority={complaint.priority} />
        </div>
      </div>

      <p className="text-sm text-grey-500">{complaint.description}</p>

      <div className="flex items-center justify-between border-t border-grey-100 pt-3 text-xs text-grey-500">
        <span>{complaint.reporterRole}</span>
        <span>{complaint.reportedAt}</span>
      </div>

      {complaint.assignedTo && (
        <div className="flex items-center gap-2 rounded-xl bg-grey-100 px-3 py-2 text-xs">
          <span className="text-grey-500">Assigned to:</span>
          <span className="text-on-surface">{complaint.assignedTo}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-xl border border-grey-300 py-2 text-xs font-medium text-on-surface transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        View Details
      </button>
    </div>
  );
}
