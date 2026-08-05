import { z } from "zod";

/**
 * A saved task template (mirrors backend TaskTemplateResponse). `tasks` is a
 * reusable list of task definitions with optional expected inventory items,
 * loaded into a floor/area group in the New Assignment form.
 */
export const TemplateTaskSchema = z.object({
  name: z.string(),
  durationMinutes: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  items: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        quantity: z.number(),
      }),
    )
    .default([]),
});
export type TemplateTask = z.infer<typeof TemplateTaskSchema>;

export const TaskTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  tasks: z.array(TemplateTaskSchema).default([]),
  createdByName: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedByName: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
export const TaskTemplateListSchema = z.array(TaskTemplateSchema);
export type TaskTemplate = z.infer<typeof TaskTemplateSchema>;

export interface SaveTaskTemplateInput {
  name: string;
  tasks: TemplateTask[];
}
