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
    // Attendance / tasks / complaints (cleaner + management facing)
    "CHECKOUT_WITH_PENDING_TASKS",
    "COMPLAINT_RAISED",
    "TASK_REDO_ASSIGNED",
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
