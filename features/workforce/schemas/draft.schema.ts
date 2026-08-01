import { z } from "zod";

/**
 * An assignment draft (mirrors backend AssignmentDraftResponse). `payload` is the
 * opaque New Assignment form state — validated by the assignment schema only when
 * the draft is loaded back into the form.
 */
export const AssignmentDraftSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  siteName: z.string().nullable().optional(),
  payload: z.unknown(),
  createdByName: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedByName: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const AssignmentDraftListSchema = z.array(AssignmentDraftSchema);

export type AssignmentDraft = z.infer<typeof AssignmentDraftSchema>;

export interface SaveDraftInput {
  title?: string;
  siteId?: string;
  payload: unknown;
}
