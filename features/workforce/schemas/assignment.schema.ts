import { z } from "zod";

// ── Enums (mirror the Spring Boot enums) ────────────────────────────────────────

export const AssignmentTypeSchema = z.enum([
  "GENERAL_TASK",
  "PERIODICAL_TASK",
  "WORK_ORDER",
]);
export type AssignmentType = z.infer<typeof AssignmentTypeSchema>;

export const ASSIGNMENT_TYPE_LABELS: Record<AssignmentType, string> = {
  GENERAL_TASK: "General Task",
  PERIODICAL_TASK: "Periodical Task",
  WORK_ORDER: "Work Order",
};

export const RecurrenceTypeSchema = z.enum(["DAILY", "WEEKLY", "MONTHLY"]);
export type RecurrenceType = z.infer<typeof RecurrenceTypeSchema>;

export const RECURRENCE_TYPE_LABELS: Record<RecurrenceType, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

export const TaskStatusSchema = z.enum([
  "SCHEDULED",
  "ACTIVE",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

// ── Response (mirrors backend TaskAssignmentResponse) ───────────────────────────

export const AssignmentCleanerSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
});

export const TaskAssignmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  siteId: z.string().uuid(),
  siteName: z.string(),
  floorId: z.string().uuid(),
  floorName: z.string(),
  areaId: z.string().uuid(),
  areaName: z.string(),
  assignmentType: AssignmentTypeSchema,
  scheduledDate: z.string(), // ISO date (yyyy-MM-dd)
  startTime: z.string(), // HH:mm[:ss]
  endTime: z.string(),
  durationMinutes: z.number(),
  status: TaskStatusSchema,
  description: z.string().nullable().optional(),
  colorHex: z.string().nullable().optional(),
  recurrenceType: RecurrenceTypeSchema.nullable().optional(),
  recurrenceCount: z.number().nullable().optional(),
  cleaners: z.array(AssignmentCleanerSchema),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const TaskAssignmentListSchema = z.array(TaskAssignmentSchema);

export type TaskAssignment = z.infer<typeof TaskAssignmentSchema>;
export type AssignmentCleaner = z.infer<typeof AssignmentCleanerSchema>;

// ── Stats (mirrors backend WorkforceStatsResponse) ──────────────────────────────

export const WorkforceStatsSchema = z.object({
  activeCleaners: z.number(),
  todaysTasks: z.number(),
  sitesManaged: z.number(),
});
export type WorkforceStats = z.infer<typeof WorkforceStatsSchema>;

// ── Form (outbound create/update payload, id-based) ─────────────────────────────

export const AssignmentFormSchema = z
  .object({
    date: z.string().min(1, "Date is required"),
    time: z.string().min(1, "Time is required"),
    name: z.string().min(2, "Task name must be at least 2 characters").max(150, "Name is too long"),
    siteId: z.string().uuid("Please select a site"),
    floorId: z.string().uuid("Please select a floor"),
    areaId: z.string().uuid("Please select an area"),
    assignmentType: AssignmentTypeSchema,
    durationHours: z.number().min(0.5, "Minimum 0.5 hours").max(24, "Maximum 24 hours"),
    description: z.string().max(2048, "Description is too long"),
    cleanerIds: z.array(z.string().uuid()).min(1, "Select at least one cleaner"),
    recurrenceType: RecurrenceTypeSchema.optional(),
    recurrenceCount: z.number().min(1, "Must be at least 1").optional(),
  })
  .superRefine((val, ctx) => {
    if (val.assignmentType === "PERIODICAL_TASK") {
      if (!val.recurrenceType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Recurrence type is required for periodical tasks",
          path: ["recurrenceType"],
        });
      }
      if (val.recurrenceCount == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Recurrence count is required for periodical tasks",
          path: ["recurrenceCount"],
        });
      }
    }
  });

export type AssignmentFormInput = z.infer<typeof AssignmentFormSchema>;
