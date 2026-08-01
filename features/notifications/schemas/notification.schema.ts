import { z } from "zod";

export const NotificationTypeSchema = z.enum([
  "LOW_STOCK",
  "REQUEST_SUBMITTED",
  "REQUEST_APPROVED",
  "REQUEST_REJECTED",
  "DELIVERY_DISPATCHED",
  "DELIVERY_CONFIRMED",
]);
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
