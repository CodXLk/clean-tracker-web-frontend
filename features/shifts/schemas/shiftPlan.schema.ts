import { z } from "zod";
import { DayOfWeekSchema, type DayOfWeek } from "@/features/user-management/schemas/site.schema";

export const ShiftPlanStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED", "SUPERSEDED", "WITHDRAWN"]);
export type ShiftPlanStatus = z.infer<typeof ShiftPlanStatusSchema>;

// Mirrors backend ShiftPlanResponse.
export const ShiftPlanSchema = z.object({
  id: z.string().uuid(),
  cleanerId: z.string().uuid().nullable().optional(),
  cleanerName: z.string().nullable().optional(),
  siteId: z.string().uuid(),
  siteName: z.string(),
  siteTimezone: z.string().nullable().optional(),
  status: ShiftPlanStatusSchema,
  source: z.string(),
  leaveCoverId: z.string().uuid().nullable().optional(),
  days: z.array(
    z.object({
      dayOfWeek: DayOfWeekSchema.nullable().optional(),
      startTime: z.string(),
      endTime: z.string(),
      crossesMidnight: z.boolean().optional(),
    }),
  ),
  cleanerNote: z.string().nullable().optional(),
  submittedAt: z.string().nullable().optional(),
  reviewedAt: z.string().nullable().optional(),
  reviewedByName: z.string().nullable().optional(),
  reviewNote: z.string().nullable().optional(),
});
export type ShiftPlan = z.infer<typeof ShiftPlanSchema>;
export const ShiftPlanListSchema = z.array(ShiftPlanSchema);

// Mirrors backend SiteShiftContextResponse.
export const SiteShiftContextSchema = z.object({
  siteId: z.string().uuid(),
  siteName: z.string(),
  streetAddress: z.string().nullable().optional(),
  timezone: z.string(),
  workingDays: z.array(DayOfWeekSchema).default([]),
  generalWindows: z
    .array(z.object({ dayOfWeek: DayOfWeekSchema, startTime: z.string(), endTime: z.string() }))
    .default([]),
  minimumWorkMinutes: z.number().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  approvedPlan: ShiftPlanSchema.nullable().optional(),
  pendingPlan: ShiftPlanSchema.nullable().optional(),
});
export type SiteShiftContext = z.infer<typeof SiteShiftContextSchema>;

/** Outbound plan body (backend ShiftPlanInput); a null day applies to every working day. */
export interface ShiftPlanInput {
  days: { dayOfWeek: DayOfWeek | null; startTime: string; endTime: string }[];
  note?: string;
}

export const DAY_SHORT: Record<DayOfWeek, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

export function formatPlanDay(d: ShiftPlan["days"][number]): string {
  const label = d.dayOfWeek ? DAY_SHORT[d.dayOfWeek] : "Every working day";
  return `${label} ${d.startTime.slice(0, 5)}–${d.endTime.slice(0, 5)}${d.crossesMidnight ? " (+1)" : ""}`;
}
