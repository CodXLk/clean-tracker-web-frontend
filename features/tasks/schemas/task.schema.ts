import { z } from "zod";

// Mirrors backend AssignmentType / TaskStatus enums.
export const AssignmentTypeSchema = z.enum([
  "GENERAL_TASK",
  "PERIODICAL_TASK",
  "WORK_ORDER",
  "OTHER",
]);
export type AssignmentType = z.infer<typeof AssignmentTypeSchema>;

export const TaskStatusSchema = z.enum([
  "SCHEDULED",
  "ACTIVE",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const CleanerSummarySchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
});

// Mirrors backend TaskOccurrenceResponse — one computed occurrence of a task on a date.
export const TaskOccurrenceSchema = z.object({
  assignmentId: z.string().uuid().nullable().optional(),
  taskId: z.string().uuid().nullable().optional(),
  occurrenceDate: z.string(),
  date: z.string(),
  name: z.string(),
  siteId: z.string().uuid(),
  siteName: z.string(),
  floorId: z.string().uuid().nullable().optional(),
  floorName: z.string().nullable().optional(),
  areaId: z.string().uuid().nullable().optional(),
  areaName: z.string().nullable().optional(),
  assignmentType: AssignmentTypeSchema.nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  durationMinutes: z.number().nullable().optional(),
  status: TaskStatusSchema,
  description: z.string().nullable().optional(),
  colorHex: z.string().nullable().optional(),
  cleaners: z.array(CleanerSummarySchema).default([]),
  recurring: z.boolean(),
  overridden: z.boolean(),
  redoId: z.string().uuid().nullable().optional(),
  isRedo: z.boolean().optional().default(false),
  isComplaint: z.boolean().optional().default(false),
});
export const TaskOccurrenceListSchema = z.array(TaskOccurrenceSchema);
export type TaskOccurrence = z.infer<typeof TaskOccurrenceSchema>;

// Mirrors backend TaskCompletionResponse.
export const TaskCompletionSchema = z.object({
  id: z.string().uuid(),
  cleanerId: z.string().uuid(),
  note: z.string().nullable().optional(),
  createdAt: z.string(),
  items: z
    .array(
      z.object({
        taskId: z.string().uuid(),
        taskName: z.string().nullable().optional(),
        date: z.string(),
      }),
    )
    .default([]),
  photos: z
    .array(
      z.object({
        id: z.string().uuid(),
        url: z.string(),
        contentType: z.string().nullable().optional(),
      }),
    )
    .default([]),
});
export type TaskCompletion = z.infer<typeof TaskCompletionSchema>;

export interface OccurrenceRef {
  taskId: string;
  date: string;
  redoId?: string;
}

export interface CompleteTasksInput {
  occurrences: OccurrenceRef[];
  note?: string;
  photos?: File[];
}
