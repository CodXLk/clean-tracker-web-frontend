import { z } from "zod";

// Mirrors backend AreaResponse.
export const AreaSchema = z.object({
  id: z.string().uuid(),
  floorId: z.string().uuid(),
  floorName: z.string(),
  siteId: z.string().uuid(),
  siteName: z.string(),
  name: z.string(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const AreaListSchema = z.array(AreaSchema);

// Outbound create/update payload — matches Create/UpdateAreaRequest (floorId supplied separately).
export const AreaFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(150, "Name is too long"),
});

export type Area = z.infer<typeof AreaSchema>;
export type AreaFormInput = z.infer<typeof AreaFormSchema>;
