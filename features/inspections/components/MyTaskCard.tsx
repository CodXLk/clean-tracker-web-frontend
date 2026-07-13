import { cn } from "@/lib/utils/cn";
import type { MyTask } from "@/features/inspections/types";

const STATUS_LABEL: Record<MyTask["status"], string> = {
  pending:     "Pending",
  in_progress: "In Progress",
  completed:   "Completed",
};

interface MyTaskCardProps {
  task:      MyTask;
  onStart:   (id: string) => void;
  onFinish:  (task: MyTask) => void;
}

export function MyTaskCard({ task, onStart, onFinish }: MyTaskCardProps) {
  return (
    <div className="flex w-[280px] shrink-0 flex-col gap-3 rounded-2xl bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-on-surface">
            {task.site} - {task.area}
          </p>
          <p className="mt-1 text-xs text-grey-500">{task.taskType}</p>
          <p className="text-xs text-grey-500">{task.description}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-xl px-2 py-1 text-xs",
            task.status === "in_progress" && "bg-[#ED5F25]/10 text-[#ED5F25]",
            task.status === "pending" && "bg-grey-100 text-grey-700",
          )}
        >
          {STATUS_LABEL[task.status]}
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-grey-100 pt-3">
        <span className="text-xs text-grey-500">Due: {task.dueTime}</span>
        {task.status === "pending" ? (
          <button
            type="button"
            onClick={() => onStart(task.id)}
            className="rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Start
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onFinish(task)}
            className="rounded-xl bg-success px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success"
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
}
