import { isAdminRole } from "@/lib/auth/roles";
import type { Notification } from "@/features/notifications/schemas/notification.schema";

const isCleaner = (role?: string | null) => role === "CLEANER" || role === "OUTSOURCE_CLEANER";
const isSupervisor = (role?: string | null) => role === "SUPERVISOR" || role === "OUTSOURCE_SUPERVISOR";

/** Role-aware deep link for a notification, or null when it has no destination. */
export function notificationHref(
  n: Pick<Notification, "type" | "refType" | "refId">,
  role: string | null | undefined,
): string | null {
  const admin = isAdminRole(role);
  switch (n.type) {
    case "LOW_STOCK":
    case "REQUEST_SUBMITTED":
    case "REQUEST_APPROVED":
    case "REQUEST_REJECTED":
    case "DELIVERY_DISPATCHED":
    case "DELIVERY_CONFIRMED":
    case "DELIVERY_NEEDS_APPROVAL":
    case "INVENTORY_EXPIRY":
      return "/admin/inventory";
    case "COMPLAINT_RAISED":
    case "COMPLAINT_COMPLETED":
    case "COMPLAINT_RESOLVED":
      return "/admin/complaints";
    case "TASK_REDO_ASSIGNED":
      return isCleaner(role) ? "/dashboard/tasks" : "/admin/cleaner-logs";
    case "TASK_ASSIGNED":
      if (isCleaner(role)) return "/dashboard/tasks";
      if (isSupervisor(role)) return "/dashboard/inspections";
      return "/admin/workforce";
    case "CHECKOUT_WITH_PENDING_TASKS":
    case "FORCED_CHECKOUT":
    case "ATTENDANCE_PAUSED":
      return isCleaner(role) ? "/dashboard" : "/admin/cleaner-logs";
    case "ASSIGNMENT_APPROVAL_REQUESTED":
      return "/dashboard";
    case "ASSIGNMENT_APPROVAL_PENDING_ALERT":
      return n.refType?.startsWith("work_order")
        ? "/admin/workforce?tab=work-orders"
        : "/admin/workforce?tab=sites";
    case "WORK_ORDER_TASKS_COMPLETED":
    case "WORK_ORDER_PENDING_REVIEW":
    case "WORK_ORDER_COMPLETED":
      return "/admin/workforce?tab=work-orders";
    case "DOCUMENT_UPLOADED":
      return n.refId ? `/admin/workforce?docUser=${n.refId}` : "/admin/workforce";
    case "LEAVE_REQUESTED":
    case "LEAVE_COVER_ACCEPTED":
      return admin ? "/admin/workforce?tab=leave" : "/dashboard/leave";
    case "LEAVE_COVER_REQUESTED":
    case "LEAVE_APPROVED":
    case "LEAVE_REJECTED":
      return "/dashboard/leave";
    case "SHIFT_PLAN_SUBMITTED":
    case "SHIFT_ADJUSTMENT_REQUESTED":
      return "/admin/workforce?tab=shift-requests";
    case "SHIFT_ADJUSTED":
      return admin || isSupervisor(role) ? "/admin/cleaner-logs" : "/dashboard/shifts";
    case "SHIFT_PLAN_APPROVED":
    case "SHIFT_PLAN_REJECTED":
    case "SHIFT_ADJUSTMENT_APPROVED":
    case "SHIFT_ADJUSTMENT_REJECTED":
      return "/dashboard/shifts";
    case "SHIFT_REMINDER": {
      // refId = siteId|date|offset|start
      const [siteId, date] = (n.refId ?? "").split("|");
      return siteId && date ? `/dashboard/shifts?siteId=${siteId}&date=${date}` : "/dashboard/shifts";
    }
    case "HOURS_REVIEW_PENDING":
    case "HOURS_APPROVAL_PENDING":
    case "HOURS_REOPENED":
      return "/admin/cleaner-logs?tab=hours";
    default:
      return null;
  }
}
