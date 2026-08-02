import { z } from "zod";

const toEmpty = z.string().nullish().transform((v) => v ?? "");

export const ComplaintPhotoSchema = z.object({
  id:          z.string(),
  url:         z.string(),
  contentType: z.string().nullish(),
});

export const ComplaintTaskSchema = z.object({
  taskId:   z.string(),
  taskName: z.string(),
  floor:    z.string().nullish(),
  area:     z.string().nullish(),
  date:     z.string(),
});

export const ComplaintSchema = z.object({
  id:           z.string(),
  code:         z.string(),
  title:        z.string(),
  description:  toEmpty,
  siteId:       z.string().nullish(),
  site:         toEmpty,
  floor:        z.string().nullish(),
  area:         z.string().nullish(),
  status:       z.enum(["open", "in_progress", "resolved", "closed"]),
  priority:     z.enum(["high", "medium", "low"]),
  reporterRole: toEmpty,
  reporterName: z.string().nullish(),
  reportedAt:   z.string(),
  resolvedAt:   z.string().nullish(),
  resolvedBy:   z.string().nullish(),
  assignedTo:   z.string().optional(),
  tasks:        z.array(ComplaintTaskSchema).default([]),
  photos:       z.array(ComplaintPhotoSchema).default([]),
  cleaners:     z
    .array(
      z.object({
        id:        z.string(),
        firstName: z.string().nullish(),
        lastName:  z.string().nullish(),
      }),
    )
    .default([]),
});

export const ComplaintKpisSchema = z.object({
  open:       z.number(),
  inProgress: z.number(),
  resolved:   z.number(),
  total:      z.number(),
});

export const ComplaintsResponseSchema = z.object({
  complaints: z.array(ComplaintSchema),
  kpis:       ComplaintKpisSchema,
});

/** Payload the supervisor sends to raise a complaint against task occurrences. */
export const CreateComplaintSchema = z.object({
  occurrences: z
    .array(z.object({ taskId: z.string(), date: z.string() }))
    .min(1, "Select at least one task"),
  title:       z.string().optional(),
  description: z.string().optional(),
  priority:    z.enum(["high", "medium", "low"]).optional(),
});

export type ComplaintPhoto        = z.infer<typeof ComplaintPhotoSchema>;
export type ComplaintTask         = z.infer<typeof ComplaintTaskSchema>;
export type Complaint             = z.infer<typeof ComplaintSchema>;
export type ComplaintKpis         = z.infer<typeof ComplaintKpisSchema>;
export type ComplaintsResponse    = z.infer<typeof ComplaintsResponseSchema>;
export type CreateComplaintInput  = z.infer<typeof CreateComplaintSchema>;
