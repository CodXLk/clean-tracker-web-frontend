import { z } from "zod";

// Mirrors backend FloorResponse.
export const FloorSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  siteName: z.string(),
  name: z.string(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const FloorListSchema = z.array(FloorSchema);

// Outbound create/update payload — matches Create/UpdateFloorRequest (siteId supplied separately).
export const FloorFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(150, "Name is too long"),
});

export type Floor = z.infer<typeof FloorSchema>;
export type FloorFormInput = z.infer<typeof FloorFormSchema>;
