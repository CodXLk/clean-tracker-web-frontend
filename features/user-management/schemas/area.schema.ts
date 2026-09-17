import { z } from "zod";

// Mirrors backend AreaResponse.
export const AreaSchema = z.object({
  id: z.string().uuid(),
  floorId: z.string().uuid(),
  floorName: z.string(),
  siteId: z.string().uuid(),
  siteName: z.string(),
  name: z.string(),
  sortOrder: z.number().default(0),
  areaGroupId: z.string().uuid().nullable().optional(),
  areaGroupName: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const AreaListSchema = z.array(AreaSchema);

// Mirrors backend AreaGroupResponse — a named set of areas within a floor.
export const AreaGroupSchema = z.object({
  id: z.string().uuid(),
  floorId: z.string().uuid(),
  floorName: z.string(),
  siteId: z.string().uuid(),
  name: z.string(),
  sortOrder: z.number().default(0),
  areas: z
    .array(z.object({ id: z.string().uuid(), name: z.string(), sortOrder: z.number().default(0) }))
    .default([]),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
export const AreaGroupListSchema = z.array(AreaGroupSchema);
export type AreaGroup = z.infer<typeof AreaGroupSchema>;

// Outbound create/update payload — matches Create/UpdateAreaRequest (floorId supplied separately).
export const AreaFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(150, "Name is too long"),
});

export type Area = z.infer<typeof AreaSchema>;
export type AreaFormInput = z.infer<typeof AreaFormSchema>;
