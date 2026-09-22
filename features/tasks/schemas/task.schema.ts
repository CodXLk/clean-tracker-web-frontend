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

export const CriticalLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type CriticalLevel = z.infer<typeof CriticalLevelSchema>;

// Whether a completion photo shows the area before or after the work.
export const PhotoStageSchema = z.enum(["BEFORE", "AFTER"]);
export type PhotoStage = z.infer<typeof PhotoStageSchema>;

// A saved draft (pre-completion) photo, kept in the completion box until the task is completed.
export const DraftPhotoSchema = z.object({
  id: z.string().uuid(),
  url: z.string().optional(),
  type: PhotoStageSchema.nullish().default("AFTER"),
});
export const DraftPhotoListSchema = z.array(DraftPhotoSchema);
export type DraftPhoto = z.infer<typeof DraftPhotoSchema>;

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
  areaGroupId: z.string().uuid().nullable().optional(),
  areaGroupName: z.string().nullable().optional(),
  groupTaskKey: z.string().uuid().nullable().optional(),
  assignmentType: AssignmentTypeSchema.nullable().optional(),
  shiftId: z.string().uuid().nullable().optional(),
  shiftName: z.string().nullable().optional(),
  shiftStartTime: z.string().nullable().optional(),
  shiftEndTime: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  durationMinutes: z.number().nullable().optional(),
  status: TaskStatusSchema,
  description: z.string().nullable().optional(),
  criticalLevel: CriticalLevelSchema.nullable().optional(),
  criticalNote: z.string().nullable().optional(),
  referencePhotoIds: z.array(z.string().uuid()).default([]),
  colorHex: z.string().nullable().optional(),
  cleaners: z.array(CleanerSummarySchema).default([]),
  recurring: z.boolean(),
  overridden: z.boolean(),
  redoId: z.string().uuid().nullable().optional(),
  isRedo: z.boolean().optional().default(false),
  isComplaint: z.boolean().optional().default(false),
  /** Originating complaint id (redo tasks) so the cleaner can view its note + photos. */
  complaintId: z.string().uuid().nullable().optional(),
  /** True once a supervisor has closed out an inspection of this occurrence (rating or complaint). */
  inspected: z.boolean().optional().default(false),
  /** Set only when the inspection was closed via a 1-10 rating. */
  inspectionRating: z.number().nullable().optional(),
  /** Cleaner-uploaded completion photo IDs — populated only when COMPLETED with photos. */
  completionPhotoIds: z.array(z.string().uuid()).optional().default([]),
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
        type: PhotoStageSchema.nullish().default("AFTER"),
      }),
    )
    .default([]),
});
export type TaskCompletion = z.infer<typeof TaskCompletionSchema>;

// Mirrors backend TaskHistoryResponse — a task's day-by-day completion history since the
// site's last inspection, shown to a supervisor reviewing days they missed.
export const TaskHistoryPhotoSchema = z.object({
  id: z.string(),
  url: z.string(),
  uploadedAt: z.string().nullish(),
  type: PhotoStageSchema.nullish().default("AFTER"),
});
export const TaskHistoryDaySchema = z.object({
  date: z.string(),
  scheduled: z.boolean(),
  completed: z.boolean(),
  inspected: z.boolean(),
  note: z.string().nullish(),
  completedByName: z.string().nullish(),
  completedAt: z.string().nullish(),
  photos: z.array(TaskHistoryPhotoSchema).default([]),
});
export const TaskHistorySchema = z.object({
  taskId: z.string(),
  taskName: z.string(),
  floor: z.string().nullish(),
  area: z.string().nullish(),
  sinceDate: z.string(),
  toDate: z.string(),
  days: z.array(TaskHistoryDaySchema).default([]),
});
export type TaskHistory = z.infer<typeof TaskHistorySchema>;
export type TaskHistoryDay = z.infer<typeof TaskHistoryDaySchema>;

export interface OccurrenceRef {
  taskId: string;
  date: string;
  redoId?: string;
}

export interface CompleteTasksInput {
  occurrences: OccurrenceRef[];
  note?: string;
  beforePhotos?: File[];
  afterPhotos?: File[];
}
