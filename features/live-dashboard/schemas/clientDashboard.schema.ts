import { z } from "zod";

/** Clients only see these three states (see backend ClientDashboardService). */
export const ClientDayStatusSchema = z.enum(["SCHEDULED", "CLEANING_IN_PROGRESS", "CLEANING_COMPLETED"]);
export type ClientDayStatus = z.infer<typeof ClientDayStatusSchema>;

export const ClientSiteDaySchema = z.object({
  siteId: z.string(),
  siteName: z.string(),
  date: z.string(),
  current: z.boolean().default(false),
  status: ClientDayStatusSchema,
  totalTasks: z.number().default(0),
  completedTasks: z.number().default(0),
});
export type ClientSiteDay = z.infer<typeof ClientSiteDaySchema>;

export const ClientOverviewSchema = z.object({
  totalSites: z.number().default(0),
  todaySites: z.number().default(0),
  todayTasks: z.number().default(0),
  todayTasksCompleted: z.number().default(0),
  today: z.array(ClientSiteDaySchema).default([]),
});
export type ClientOverview = z.infer<typeof ClientOverviewSchema>;

export const ClientScheduleSchema = z.object({
  sites: z.array(z.object({ id: z.string(), name: z.string(), workOrderSite: z.boolean().default(false) })).default([]),
  days: z.array(ClientSiteDaySchema).default([]),
});
export type ClientSchedule = z.infer<typeof ClientScheduleSchema>;