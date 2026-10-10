import { z } from "zod";

export const WorkOrderHourEntrySchema = z.object({
  id: z.string().uuid(),
  cleanerId: z.string().uuid(),
  cleanerName: z.string().nullable().optional(),
  entryDate: z.string().nullable().optional(),
  systemHours: z.number().nullable().optional(),
  supervisorHours: z.number().nullable().optional(),
  adminHours: z.number().nullable().optional(),
  systemAmount: z.number().nullable().optional(),
  supervisorAmount: z.number().nullable().optional(),
  adminAmount: z.number().nullable().optional(),
  effectiveHours: z.number().nullable().optional(),
  effectiveAmount: z.number().nullable().optional(),
});
export type WorkOrderHourEntry = z.infer<typeof WorkOrderHourEntrySchema>;

export const WorkOrderHoursReviewSchema = z.object({
  workOrderId: z.string().uuid(),
  poId: z.string().nullable().optional(),
  mode: z.enum(["RATE_PER_HOUR", "TOTAL_AMOUNT"]),
  rate: z.number().nullable().optional(),
  approved: z.boolean(),
  entries: z.array(WorkOrderHourEntrySchema).default([]),
});
export type WorkOrderHoursReview = z.infer<typeof WorkOrderHoursReviewSchema>;

export interface SaveHoursInput {
  workOrderId: string;
  entries: { id: string; hours?: number | null; amount?: number | null }[];
}
