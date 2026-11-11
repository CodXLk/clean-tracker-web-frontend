"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

// Mirrors backend AttendanceTimeService.Row / Summary.
export const TimeRowSchema = z.object({
  personId: z.string().uuid(),
  cleanerId: z.string().uuid().nullable().optional(),
  personName: z.string(),
  personRole: z.enum(["CLEANER", "SUPERVISOR"]),
  siteId: z.string().uuid(),
  siteName: z.string(),
  type: z.enum(["GENERAL", "WORK_ORDER", "SUPERVISION"]),
  workOrderId: z.string().uuid().nullable().optional(),
  poId: z.string().nullable().optional(),
  sessions: z.number(),
  openSessions: z.number(),
  grossMinutes: z.number(),
  pausedMinutes: z.number(),
  workedMinutes: z.number(),
  generalMinutes: z.number(),
  periodicalMinutes: z.number(),
  lateMinutes: z.number(),
  lateSessions: z.number(),
  closeReasons: z.record(z.string(), z.number()).default({}),
  firstDate: z.string().nullable().optional(),
  lastDate: z.string().nullable().optional(),
});
export type TimeRow = z.infer<typeof TimeRowSchema>;

export const TimeSummarySchema = z.object({
  from: z.string(),
  to: z.string(),
  rows: z.array(TimeRowSchema),
  totals: z.object({
    grossMinutes: z.number(),
    pausedMinutes: z.number(),
    workedMinutes: z.number(),
    generalMinutes: z.number(),
    periodicalMinutes: z.number(),
    workOrderMinutes: z.number(),
    supervisionMinutes: z.number(),
    sessions: z.number(),
  }),
});
export type TimeSummary = z.infer<typeof TimeSummarySchema>;

export interface TimeSummaryFilters {
  userId?: string;
  cleanerId?: string;
  siteId?: string;
  from?: string;
  to?: string;
}

function clean(filters: TimeSummaryFilters) {
  return Object.fromEntries(Object.entries(filters).filter(([, v]) => !!v));
}

export function useTimeSummary(filters: TimeSummaryFilters, mine = false) {
  return useQuery({
    queryKey: ["attendance", mine ? "my-time" : "time-summary", filters],
    queryFn: async () => {
      const { data } = await clientApi.get(mine ? ENDPOINTS.attendance.myTime : ENDPOINTS.attendance.timeSummary, {
        params: clean(filters),
      });
      return TimeSummarySchema.parse(data);
    },
  });
}

/** 125 → "2h 05m". */
export function formatMinutes(minutes?: number | null): string {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export const TIME_TYPE_LABELS: Record<TimeRow["type"], string> = {
  GENERAL: "General",
  WORK_ORDER: "Work order",
  SUPERVISION: "Supervision",
};

export const CLOSE_REASON_LABELS: Record<string, string> = {
  CHECKED_OUT: "Checked out",
  BELOW_MINIMUM: "Below minimum",
  PENDING_TASKS: "Pending tasks",
  EARLY_BEFORE_SHIFT_END: "Early",
  FORGOT_CHECKOUT: "Forgot check-out",
  WORK_ORDER_COMPLETED: "Work order completed",
  FORCED: "Forced",
};
