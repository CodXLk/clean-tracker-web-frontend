import { z } from "zod";

// Mirrors backend OutsourceScopeType.
export const OUTSOURCE_SCOPE_VALUES = ["SITE", "FLOORS", "AREAS", "TASKS"] as const;
export const OutsourceScopeSchema = z.enum(OUTSOURCE_SCOPE_VALUES);
export type OutsourceScopeType = z.infer<typeof OutsourceScopeSchema>;

export const OUTSOURCE_SCOPE_LABELS: Record<OutsourceScopeType, string> = {
  SITE: "Whole site",
  FLOORS: "Selected floors",
  AREAS: "Selected areas",
  TASKS: "Selected tasks",
};

// Mirrors backend OutsourceProjectResponse.
export const OutsourceProjectSchema = z.object({
  id: z.string().uuid(),
  companyName: z.string(),
  contactPersonName: z.string().nullable().optional(),
  contactNumber: z.string().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  siteName: z.string().nullable().optional(),
  scopeType: OutsourceScopeSchema,
  floorIds: z.array(z.string().uuid()).default([]),
  areaIds: z.array(z.string().uuid()).default([]),
  taskIds: z.array(z.string().uuid()).default([]),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  cleanerId: z.string().uuid().nullable().optional(),
  cleanerName: z.string().nullable().optional(),
  cleanerEmail: z.string().nullable().optional(),
  supervisorId: z.string().uuid().nullable().optional(),
  supervisorName: z.string().nullable().optional(),
  supervisorEmail: z.string().nullable().optional(),
  taskCount: z.number().default(0),
  active: z.boolean().default(true),
  createdAt: z.string().nullable().optional(),
});
export type OutsourceProject = z.infer<typeof OutsourceProjectSchema>;

export const OutsourceProjectListSchema = z.array(OutsourceProjectSchema);

// Outbound create payload — matches CreateOutsourceProjectRequest.
export interface CreateOutsourceProjectInput {
  companyName: string;
  contactPersonName?: string;
  contactNumber?: string;
  siteId: string;
  scopeType: OutsourceScopeType;
  floorIds?: string[];
  areaIds?: string[];
  taskIds?: string[];
  startDate: string;
  endDate: string;
  cleanerEmail: string;
  supervisorEmail: string;
}
