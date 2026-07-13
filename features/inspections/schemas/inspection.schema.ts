import { z } from "zod";

export const AreaInspectionSchema = z.object({
  id:          z.string(),
  site:        z.string(),
  area:        z.string(),
  reportedAgo: z.string(),
  priority:    z.enum(["high", "medium", "low"]),
});

export const MyTaskSchema = z.object({
  id:          z.string(),
  site:        z.string(),
  area:        z.string(),
  taskType:    z.string(),
  description: z.string(),
  status:      z.enum(["pending", "in_progress", "completed"]),
  dueTime:     z.string(),
});

export const SitePerformanceSchema = z.object({
  site:       z.string(),
  completion: z.number(),
  avgTime:    z.string(),
  rating:     z.number(),
});

export const CleanerRankingSchema = z.object({
  rank:           z.number(),
  cleaner:        z.string(),
  site:           z.string(),
  tasksCompleted: z.number(),
  avgRating:      z.number(),
  onTimeRate:     z.number(),
  performance:    z.number(),
});

export const InspectionKpisSchema = z.object({
  taskCompletionRate:  z.number(),
  avgTaskDurationHours: z.number(),
  customerSatisfaction: z.number(),
  activeCleaners:       z.number(),
});

export const InspectionsResponseSchema = z.object({
  kpis:            InspectionKpisSchema,
  areas:           z.array(AreaInspectionSchema),
  myTasks:         z.array(MyTaskSchema),
  sitePerformance: z.array(SitePerformanceSchema),
  cleanerRankings: z.array(CleanerRankingSchema),
});

export const CompleteTaskSchema = z.object({
  notes:         z.string(),
  qualityRating: z.number().min(1, "Select a quality rating").max(10),
});

export type AreaInspection      = z.infer<typeof AreaInspectionSchema>;
export type MyTask              = z.infer<typeof MyTaskSchema>;
export type SitePerformance     = z.infer<typeof SitePerformanceSchema>;
export type CleanerRanking      = z.infer<typeof CleanerRankingSchema>;
export type InspectionKpis      = z.infer<typeof InspectionKpisSchema>;
export type InspectionsResponse = z.infer<typeof InspectionsResponseSchema>;
export type CompleteTaskInput   = z.infer<typeof CompleteTaskSchema>;
