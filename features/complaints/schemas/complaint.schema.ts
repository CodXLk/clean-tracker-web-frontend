import { z } from "zod";

export const ComplaintTimelineEntrySchema = z.object({
  label: z.string(),
  at:    z.string(),
});

export const ComplaintSchema = z.object({
  id:           z.string(),
  code:         z.string(),
  title:        z.string(),
  description:  z.string(),
  floor:        z.string(),
  site:         z.string(),
  status:       z.enum(["open", "in_progress", "resolved", "closed"]),
  priority:     z.enum(["high", "medium", "low"]),
  reporterRole: z.string(),
  reportedAt:   z.string(),
  assignedTo:   z.string().optional(),
  timeline:     z.array(ComplaintTimelineEntrySchema),
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

export const CreateComplaintSchema = z.object({
  title:        z.string().min(1, "Title is required"),
  description:  z.string().min(1, "Description is required"),
  site:         z.string().min(1, "Site is required"),
  floor:        z.string().min(1, "Location is required"),
  priority:     z.enum(["high", "medium", "low"]),
  reporterRole: z.string().min(1, "Reporter role is required"),
});

export type Complaint             = z.infer<typeof ComplaintSchema>;
export type ComplaintKpis         = z.infer<typeof ComplaintKpisSchema>;
export type ComplaintsResponse    = z.infer<typeof ComplaintsResponseSchema>;
export type CreateComplaintInput  = z.infer<typeof CreateComplaintSchema>;
