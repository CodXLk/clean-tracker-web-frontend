import { z } from "zod";
import { DayOfWeekSchema } from "@/features/user-management/schemas/site.schema";

export const RECURRENCE_TYPE_VALUES = ["DAILY", "WEEKLY", "MONTHLY"] as const;
export const RecurrenceTypeSchema = z.enum(RECURRENCE_TYPE_VALUES);
export type RecurrenceType = z.infer<typeof RecurrenceTypeSchema>;

export const RECURRENCE_TYPE_LABELS: Record<RecurrenceType, string> = {
  DAILY: "Day",
  WEEKLY: "Week",
  MONTHLY: "Month",
};

// Mirrors backend SupervisorScheduleResponse.
export const SupervisorScheduleSchema = z.object({
  id: z.string(),
  siteId: z.string().nullish(),
  siteName: z.string().nullish(),
  supervisorId: z.string(),
  supervisorName: z.string().nullish(),
  startDate: z.string().nullish(),
  recurrenceType: RecurrenceTypeSchema,
  recurrenceInterval: z.number(),
  daysOfWeek: z.array(DayOfWeekSchema).default([]),
  dayOfMonth: z.number().nullish(),
  weekOfMonth: z.number().nullish(),
  monthlyWeekday: DayOfWeekSchema.nullish(),
  summary: z.string().nullish(),
  upcomingDates: z.array(z.string()).default([]),
});
export const SupervisorScheduleListSchema = z.array(SupervisorScheduleSchema);
export type SupervisorSchedule = z.infer<typeof SupervisorScheduleSchema>;

// Outbound upsert payload — matches UpsertSupervisorScheduleRequest.
export interface UpsertSupervisorSchedulePayload {
  supervisorId: string;
  recurrenceType: RecurrenceType;
  recurrenceInterval: number;
  daysOfWeek?: string[];
  dayOfMonth?: number | null;
  weekOfMonth?: number | null;
  monthlyWeekday?: string | null;
  startDate?: string;
}
