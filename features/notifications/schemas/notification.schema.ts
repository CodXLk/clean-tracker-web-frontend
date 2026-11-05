import { z } from "zod";

// Mirrors the Spring Boot NotificationType enum (all roles). "OTHER" is a
// frontend-only fallback so any future backend type degrades gracefully instead
// of throwing during response validation and breaking the whole list.
export const NotificationTypeSchema = z
  .enum([
    // Inventory
    "LOW_STOCK",
    "REQUEST_SUBMITTED",
    "REQUEST_APPROVED",
    "REQUEST_REJECTED",
    "DELIVERY_DISPATCHED",
    "DELIVERY_CONFIRMED",
    "DELIVERY_NEEDS_APPROVAL",
    "INVENTORY_EXPIRY",
    // Attendance / tasks / complaints (cleaner + management facing)
    "CHECKOUT_WITH_PENDING_TASKS",
    "FORCED_CHECKOUT",
    "ATTENDANCE_PAUSED",
    "COMPLAINT_RAISED",
    "COMPLAINT_COMPLETED",
    "COMPLAINT_RESOLVED",
    "TASK_REDO_ASSIGNED",
    "TASK_ASSIGNED",
    // Work orders
    "WORK_ORDER_TASKS_COMPLETED",
    "WORK_ORDER_PENDING_REVIEW",
    "WORK_ORDER_COMPLETED",
    // Slot assignment acceptance
    "ASSIGNMENT_APPROVAL_REQUESTED",
    "ASSIGNMENT_APPROVAL_PENDING_ALERT",
    // Leave
    "LEAVE_REQUESTED",
    "LEAVE_COVER_REQUESTED",
    "LEAVE_COVER_ACCEPTED",
    "LEAVE_APPROVED",
    "LEAVE_REJECTED",
    // Compliance
    "DOCUMENT_UPLOADED",
    // Forward-compat fallback (never sent by the backend)
    "OTHER",
  ])
  .catch("OTHER");
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  type: NotificationTypeSchema,
  title: z.string(),
  message: z.string().nullable().optional(),
  read: z.boolean(),
  refType: z.string().nullable().optional(),
  refId: z.string().nullable().optional(),
  createdAt: z.string(),
});
export const NotificationListSchema = z.array(NotificationSchema);
export type Notification = z.infer<typeof NotificationSchema>;

export const UnreadCountSchema = z.object({ count: z.number() });
