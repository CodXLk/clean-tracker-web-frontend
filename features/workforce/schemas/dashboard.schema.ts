import { z } from "zod";

const CountItemSchema = z.object({ label: z.string(), value: z.number() });
const TrendPointSchema = z.object({
  date: z.string(),
  total: z.number(),
  completed: z.number(),
});

export const AdminDashboardSchema = z.object({
  totals: z.object({
    cleaners: z.number(),
    supervisors: z.number(),
    sites: z.number(),
  }),
  today: z.object({
    total: z.number(),
    completed: z.number(),
    inProgress: z.number(),
    scheduled: z.number(),
    cancelled: z.number(),
    completionRate: z.number(),
  }),
  sites: z.object({
    withTasks: z.number(),
    tasksCompleted: z.number(),
    pendingInspection: z.number(),
    inspected: z.number(),
  }),
  complaints: z.object({
    open: z.number(),
    inProgress: z.number(),
    resolved: z.number(),
    total: z.number(),
  }),
  statusBreakdown: z.array(CountItemSchema).default([]),
  weeklyTrend: z.array(TrendPointSchema).default([]),
  ongoing: z
    .array(
      z.object({
        taskId: z.string().nullable().optional(),
        date: z.string().nullable().optional(),
        taskName: z.string().nullable().optional(),
        siteName: z.string().nullable().optional(),
        cleaner: z.string().nullable().optional(),
        startTime: z.string().nullable().optional(),
        status: z.string().nullable().optional(),
      }),
    )
    .default([]),
  recentComplaints: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        siteName: z.string().nullable().optional(),
        status: z.string(),
        priority: z.string().nullable().optional(),
        createdAt: z.string().nullable().optional(),
      }),
    )
    .default([]),
});

export type AdminDashboard = z.infer<typeof AdminDashboardSchema>;
export type DashboardCountItem = z.infer<typeof CountItemSchema>;
export type DashboardTrendPoint = z.infer<typeof TrendPointSchema>;
