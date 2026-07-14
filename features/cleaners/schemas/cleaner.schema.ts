import { z } from "zod";

// Mirrors backend CleanerResponse.
export const CleanerSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const CleanerListSchema = z.array(CleanerSchema);

export type Cleaner = z.infer<typeof CleanerSchema>;
