import type { TaskSummaryStatus } from "@/components/shared/TaskSummaryCard";
import type { AssignmentType, TaskStatus } from "@/features/tasks/schemas/task.schema";

/** Local (not UTC) YYYY-MM-DD for a date — matches how the cleaner perceives "today". */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Map a backend TaskStatus onto the shared summary-card status vocabulary. */
export function toSummaryStatus(status: TaskStatus): TaskSummaryStatus {
  switch (status) {
    case "COMPLETED":
      return "completed";
    case "IN_PROGRESS":
      return "in_progress";
    case "SCHEDULED":
      return "scheduled";
    default:
      return "pending";
  }
}

const ASSIGNMENT_TYPE_LABEL: Record<AssignmentType, string> = {
  GENERAL_TASK: "General",
  PERIODICAL_TASK: "Periodical",
  WORK_ORDER: "Work Order",
  OTHER: "Other",
};

export function assignmentTypeLabel(type: AssignmentType): string {
  return ASSIGNMENT_TYPE_LABEL[type] ?? "Task";
}

/** Format a "HH:mm[:ss]" wall-clock time into a friendly "h:mm AM/PM" label. */
export function formatTaskTime(time?: string | null): string | null {
  if (!time) return null;
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? "0");
  if (Number.isNaN(h)) return null;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}
