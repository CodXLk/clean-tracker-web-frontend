import { z } from "zod";

// Mirrors backend PendingAssignmentResponse.
export const PendingAssignmentSchema = z.object({
  type: z.enum(["SITE_CLEANER", "SITE_SUPERVISOR", "WORK_ORDER_CLEANER", "WORK_ORDER_SUPERVISOR"]),
  profileId: z.string().uuid(),
  label: z.string(),
  locationName: z.string(),
  siteId: z.string().uuid().nullable().optional(),
  assignedAt: z.string().nullable().optional(),
});
export type PendingAssignment = z.infer<typeof PendingAssignmentSchema>;
export const PendingAssignmentListSchema = z.array(PendingAssignmentSchema);

// Mirrors backend ManagementAssignmentAlertResponse.
export const ManagementAssignmentAlertSchema = z.object({
  type: z.enum(["SITE_CLEANER", "SITE_SUPERVISOR", "WORK_ORDER_CLEANER", "WORK_ORDER_SUPERVISOR"]),
  profileId: z.string().uuid(),
  label: z.string(),
  locationName: z.string(),
  siteId: z.string().uuid().nullable().optional(),
  reason: z.enum(["UNACCEPTED", "UNASSIGNED"]),
  personName: z.string().nullable().optional(),
  startedAt: z.string().nullable().optional(),
});
export type ManagementAssignmentAlert = z.infer<typeof ManagementAssignmentAlertSchema>;
export const ManagementAssignmentAlertListSchema = z.array(ManagementAssignmentAlertSchema);
