import { z } from "zod";

export const UUIDSchema = z.string().uuid();

export const PaginationSchema = z.object({
  page:          z.number().int().min(0).default(0),
  size:          z.number().int().min(1).max(100).default(10),
  totalElements: z.number().int(),
  totalPages:    z.number().int(),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    content:       z.array(itemSchema),
    page:          z.number().int(),
    size:          z.number().int(),
    totalElements: z.number().int(),
    totalPages:    z.number().int(),
  });

export type Pagination = z.infer<typeof PaginationSchema>;
