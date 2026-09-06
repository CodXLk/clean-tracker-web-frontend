import { z } from "zod";
import { DayOfWeekSchema } from "@/features/user-management/schemas/site.schema";

// ── Enums (mirror the Spring Boot enums) ────────────────────────────────────────

export const WorkTypeSchema = z.enum([
  "GENERAL_TASK",
  "PERIODICAL_TASK",
  "WORK_ORDER",
  "OTHER",
]);
export type WorkType = z.infer<typeof WorkTypeSchema>;

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  GENERAL_TASK: "General",
  PERIODICAL_TASK: "Periodical",
  WORK_ORDER: "Work Order",
  OTHER: "Other",
};

export const RecurrenceTypeSchema = z.enum(["DAILY", "WEEKLY", "MONTHLY"]);
export type RecurrenceType = z.infer<typeof RecurrenceTypeSchema>;

export const RECURRENCE_TYPE_LABELS: Record<RecurrenceType, string> = {
  DAILY: "Day",
  WEEKLY: "Week",
  MONTHLY: "Month",
};

/** Ordinal week within a month for the monthly "nth weekday" mode. */
export const WEEK_OF_MONTH_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: "1st" },
  { value: 2, label: "2nd" },
  { value: 3, label: "3rd" },
  { value: 4, label: "4th" },
];

export const TaskStatusSchema = z.enum([
  "SCHEDULED",
  "ACTIVE",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const OccurrenceScopeSchema = z.enum(["THIS", "THIS_AND_FOLLOWING", "ALL"]);
export type OccurrenceScope = z.infer<typeof OccurrenceScopeSchema>;

// ── Responses (mirror backend DTOs) ─────────────────────────────────────────────

export const AssignmentCleanerSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
});
export type AssignmentCleaner = z.infer<typeof AssignmentCleanerSchema>;

/** One expanded calendar occurrence (backend TaskOccurrenceResponse). */
export const TaskOccurrenceSchema = z.object({
  assignmentId: z.string().uuid(),
  taskId: z.string().uuid(),
  /** Original series date — identifies the occurrence for edit/delete calls. */
  occurrenceDate: z.string(),
  /** Displayed date (differs from occurrenceDate when moved by an override). */
  date: z.string(),
  name: z.string(),
  siteId: z.string().uuid(),
  siteName: z.string(),
  floorId: z.string().uuid(),
  floorName: z.string(),
  areaId: z.string().uuid(),
  areaName: z.string(),
  floorSortOrder: z.number().default(0),
  areaSortOrder: z.number().default(0),
  orderIndex: z.number().default(0),
  assignmentType: WorkTypeSchema,
  poId: z.string().nullable().optional(),
  templateName: z.string().nullable().optional(),
  shiftId: z.string().uuid().nullable().optional(),
  shiftName: z.string().nullable().optional(),
  shiftStartTime: z.string().nullable().optional(),
  shiftEndTime: z.string().nullable().optional(),
  startTime: z.string(), // HH:mm[:ss]
  endTime: z.string(),
  durationMinutes: z.number(),
  status: TaskStatusSchema,
  description: z.string().nullable().optional(),
  colorHex: z.string().nullable().optional(),
  cleaners: z.array(AssignmentCleanerSchema),
  supervisors: z.array(AssignmentCleanerSchema).default([]),
  cleanerProfiles: z
    .array(z.object({ id: z.string().uuid(), label: z.string(), name: z.string().nullable().optional() }))
    .default([]),
  supervisorProfiles: z
    .array(z.object({ id: z.string().uuid(), label: z.string(), name: z.string().nullable().optional() }))
    .default([]),
  outsourceCleanerIds: z.array(z.string().uuid()).default([]),
  items: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        name: z.string(),
        quantity: z.number(),
        unit: z.string().nullable().optional(),
      }),
    )
    .default([]),
  recurring: z.boolean(),
  overridden: z.boolean(),
  recurrenceType: RecurrenceTypeSchema.nullish(),
  recurrenceInterval: z.number().nullish(),
  recurrenceDays: z.array(DayOfWeekSchema).default([]),
});
export const TaskOccurrenceListSchema = z.array(TaskOccurrenceSchema);
export type TaskOccurrence = z.infer<typeof TaskOccurrenceSchema>;

// Mirrors backend SiteTaskSummaryResponse — every task at a site plus the next date it
// occurs after the visible week (null = no upcoming occurrence within the lookahead).
export const AssignmentTaskStatusSchema = z.enum(["ACTIVE", "INACTIVE", "DELETED"]);
export type AssignmentTaskStatus = z.infer<typeof AssignmentTaskStatusSchema>;

export const SiteTaskSummarySchema = z.object({
  taskId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  name: z.string(),
  floorId: z.string().uuid().nullish(),
  floorName: z.string().nullish(),
  areaId: z.string().uuid().nullish(),
  areaName: z.string().nullish(),
  assignmentType: WorkTypeSchema,
  orderIndex: z.number().default(0),
  nextDate: z.string().nullish(),
  recurrenceLabel: z.string().nullish(),
  recurrenceType: RecurrenceTypeSchema.nullish(),
  recurrenceInterval: z.number().nullish(),
  recurrenceDays: z.array(DayOfWeekSchema).default([]),
  status: AssignmentTaskStatusSchema.default("ACTIVE"),
});
export const SiteTaskSummaryListSchema = z.array(SiteTaskSummarySchema);
export type SiteTaskSummary = z.infer<typeof SiteTaskSummarySchema>;

/** Task counts per lifecycle status at a site, for the filter badges. */
export const SiteTaskStatusCountsSchema = z.object({
  ACTIVE: z.number().default(0),
  INACTIVE: z.number().default(0),
  DELETED: z.number().default(0),
});
export type SiteTaskStatusCounts = z.infer<typeof SiteTaskStatusCountsSchema>;

/** Backend AssignmentResponse (returned by create/update/detail). */
export const AssignmentSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  siteName: z.string(),
  shiftId: z.string().uuid().nullable().optional(),
  shiftName: z.string().nullable().optional(),
  shiftStartTime: z.string().nullable().optional(),
  shiftEndTime: z.string().nullable().optional(),
  assignmentType: WorkTypeSchema,
  poId: z.string().nullable().optional(),
  startDate: z.string(),
  startTime: z.string(),
  expectedEndTime: z.string(),
  seriesEndDate: z.string().nullable().optional(),
  recurrenceType: RecurrenceTypeSchema.nullable().optional(),
  recurrenceInterval: z.number().nullable().optional(),
  daysOfWeek: z.array(DayOfWeekSchema).default([]),
  dayOfMonth: z.number().nullable().optional(),
  weekOfMonth: z.number().nullable().optional(),
  monthlyWeekday: DayOfWeekSchema.nullable().optional(),
  otherRepeatWorkingDays: z.boolean(),
  otherUseRecurrence: z.boolean(),
  generalUseRecurrence: z.boolean().default(false),
  recurring: z.boolean(),
  tasks: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      durationMinutes: z.number().nullable().optional(),
      floorId: z.string().uuid(),
      floorName: z.string(),
      areaId: z.string().uuid(),
      areaName: z.string(),
      description: z.string().nullable().optional(),
      colorHex: z.string().nullable().optional(),
      orderIndex: z.number(),
      endDate: z.string().nullable().optional(),
      recurrenceType: RecurrenceTypeSchema.nullable().optional(),
      recurrenceInterval: z.number().nullable().optional(),
      daysOfWeek: z.array(DayOfWeekSchema).default([]),
      dayOfMonth: z.number().nullable().optional(),
      weekOfMonth: z.number().nullable().optional(),
      monthlyWeekday: DayOfWeekSchema.nullable().optional(),
      cleaners: z.array(AssignmentCleanerSchema),
      supervisors: z.array(AssignmentCleanerSchema).default([]),
      profiles: z
        .array(z.object({ id: z.string().uuid(), label: z.string().nullish() }))
        .default([]),
      items: z
        .array(
          z.object({
            itemId: z.string().uuid(),
            itemName: z.string(),
            unit: z.string().nullable().optional(),
            quantity: z.number(),
          }),
        )
        .default([]),
    }),
  ),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
export type Assignment = z.infer<typeof AssignmentSchema>;

// ── Stats (mirrors backend WorkforceStatsResponse) ──────────────────────────────

export const WorkforceStatsSchema = z.object({
  activeCleaners: z.number(),
  todaysTasks: z.number(),
  sitesManaged: z.number(),
});
export type WorkforceStats = z.infer<typeof WorkforceStatsSchema>;

// ── Create-assignment form ──────────────────────────────────────────────────────

/** Scheduling length assumed for tasks without an explicit duration (matches backend). */
export const DEFAULT_TASK_DURATION_MINUTES = 30;

/**
 * One task inside a location group. Floor/area live on the group, so a task only
 * carries what changes per task — enabling the "quick add many" flow.
 */
export const GroupTaskFormSchema = z.object({
  /** Present when editing an existing assignment — keeps the task (and its completion
   *  history/overrides) in place instead of deleting and recreating it. */
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Task name must be at least 2 characters").max(150, "Name is too long"),
  /** Minutes; empty input maps to undefined (optional per spec). */
  durationMinutes: z
    .number()
    .min(5, "Minimum 5 minutes")
    .max(24 * 60, "Maximum 24 hours")
    .optional(),
  description: z.string().max(2048, "Description is too long").optional().or(z.literal("")),
  /** Per-task cleaners — only used when assignPerTask is on and the site has no profiles. */
  cleanerIds: z.array(z.string().uuid()),
  /** Per-task responsible cleaner profiles (slots) — only used when assignPerTask is on. */
  profileIds: z.array(z.string().uuid()),
  /** Optional expected inventory items consumed when the task completes. */
  items: z.array(
    z.object({
      itemId: z.string().uuid("Select an item"),
      quantity: z.number().positive("Quantity must be greater than zero"),
    }),
  ),
  // Optional per-task recurrence override (used within a recurrence-capable assignment).
  // When recurrenceType is set, this task schedules on its own rule instead of the assignment's.
  recurrenceType: RecurrenceTypeSchema.optional(),
  recurrenceInterval: z.number().min(1).optional(),
  daysOfWeek: z.array(DayOfWeekSchema),
  monthlyMode: z.enum(["DAY_OF_MONTH", "DAY_OF_WEEK"]),
  dayOfMonth: z.number().min(1).max(31).optional(),
  weekOfMonth: z.number().min(1).max(4).optional(),
  monthlyWeekday: DayOfWeekSchema.optional(),
});
export type GroupTaskFormInput = z.infer<typeof GroupTaskFormSchema>;

/** A floor with one or more areas; every task in the group is created in each selected area. */
export const LocationGroupFormSchema = z.object({
  floorId: z.string().uuid("Please select a floor"),
  areaIds: z.array(z.string().uuid()).min(1, "Please select at least one area"),
  tasks: z.array(GroupTaskFormSchema),
});
export type LocationGroupFormInput = z.infer<typeof LocationGroupFormSchema>;

export const AssignmentFormSchema = z
  .object({
    workType: WorkTypeSchema,
    siteId: z.string().uuid("Please select a site"),
    /** Optional work shift; empty means a full-day window. */
    shiftId: z.string().uuid().optional().or(z.literal("")),
    date: z.string().min(1, "Date is required"),
    /** Optional series end — bounds a scope-view one-off to a single date. */
    seriesEndDate: z.string().nullable().optional(),
    startTime: z.string().min(1, "Expected start time is required"),
    /** Purchase-order reference — required for Work Order assignments. */
    poId: z.string().max(100, "PO ID is too long").optional().or(z.literal("")),
    /** Name of the saved task-list template used to build this assignment, if any. */
    templateName: z.string().max(150, "Template name is too long").optional().or(z.literal("")),
    groups: z.array(LocationGroupFormSchema).min(1, "Add a floor and area"),
    /** Assignment-level cleaner selection (applies to all tasks unless assignPerTask). */
    cleanerIds: z.array(z.string().uuid()),
    /** Assignment-level responsible cleaner profiles (slots) — default all responsible. */
    profileIds: z.array(z.string().uuid()),
    /** Assignment-level supervisor selection (applies to every task). */
    supervisorIds: z.array(z.string().uuid()),
    assignPerTask: z.boolean(),
    // Recurrence — Periodical, or Other with custom recurrence enabled.
    recurrenceType: RecurrenceTypeSchema.optional(),
    recurrenceCount: z.number().min(1, "Must be at least 1").optional(),
    daysOfWeek: z.array(DayOfWeekSchema),
    // Monthly: pick a day-of-month, OR an ordinal weekday (e.g. 2nd Wednesday).
    monthlyMode: z.enum(["DAY_OF_MONTH", "DAY_OF_WEEK"]),
    dayOfMonth: z.number().min(1).max(31).optional(),
    weekOfMonth: z.number().min(1).max(4).optional(),
    monthlyWeekday: DayOfWeekSchema.optional(),
    // Other-type behaviour toggles.
    otherRepeatWorkingDays: z.boolean(),
    otherUseRecurrence: z.boolean(),
    // General-task: use the recurrence rule instead of site working days.
    generalUseRecurrence: z.boolean(),
  })
  .superRefine((val, ctx) => {
    const usesRecurrence =
      val.workType === "PERIODICAL_TASK" ||
      (val.workType === "OTHER" && val.otherUseRecurrence) ||
      (val.workType === "GENERAL_TASK" && val.generalUseRecurrence);

    if (val.workType === "WORK_ORDER" && !val.poId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PO ID is required for a work order",
        path: ["poId"],
      });
    }

    if (usesRecurrence) {
      if (!val.recurrenceType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Recurrence type is required",
          path: ["recurrenceType"],
        });
      }
      if (val.recurrenceCount == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Recurrence count is required",
          path: ["recurrenceCount"],
        });
      }
      if (val.recurrenceType === "WEEKLY" && val.daysOfWeek.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select at least one day of the week",
          path: ["daysOfWeek"],
        });
      }
      if (val.recurrenceType === "MONTHLY") {
        if (val.monthlyMode === "DAY_OF_MONTH" && val.dayOfMonth == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Select a day of the month",
            path: ["dayOfMonth"],
          });
        }
        if (val.monthlyMode === "DAY_OF_WEEK") {
          if (val.weekOfMonth == null) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Select which week (1st–4th)",
              path: ["weekOfMonth"],
            });
          }
          if (!val.monthlyWeekday) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Select a weekday",
              path: ["monthlyWeekday"],
            });
          }
        }
      }
    }

    // At least one task overall.
    const totalTasks = val.groups.reduce((sum, g) => sum + g.tasks.length, 0);
    if (totalTasks === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one task",
        path: ["groups"],
      });
    }

    // Each group must have at least one task.
    val.groups.forEach((group, gi) => {
      if (group.tasks.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Add at least one task, or remove this floor/area",
          path: ["groups", gi, "tasks"],
        });
      }
    });

    // Cleaner / profile assignment is optional: when a task has no cleaner and no profile
    // slot selected it belongs to ALL of the site's cleaner slots (resolved on the backend).
  });

export type AssignmentFormInput = z.infer<typeof AssignmentFormSchema>;

/** Map a saved assignment (detail response) back into the form for full editing.
 *  Each task becomes its own floor/area group so nothing is lost on round-trip. */
export function assignmentToFormInput(a: Assignment): AssignmentFormInput {
  const groups: LocationGroupFormInput[] = a.tasks.map((t) => ({
    floorId: t.floorId,
    areaIds: [t.areaId],
    tasks: [
      {
        id: t.id,
        name: t.name,
        durationMinutes: t.durationMinutes ?? undefined,
        description: t.description ?? "",
        cleanerIds: t.cleaners.map((c) => c.id),
        profileIds: [],
        items: t.items.map((it) => ({ itemId: it.itemId, quantity: it.quantity })),
        daysOfWeek: t.daysOfWeek ?? [],
        monthlyMode: t.weekOfMonth != null ? "DAY_OF_WEEK" : "DAY_OF_MONTH",
        recurrenceType: t.recurrenceType ?? undefined,
        recurrenceInterval: t.recurrenceInterval ?? undefined,
        dayOfMonth: t.dayOfMonth ?? undefined,
        weekOfMonth: t.weekOfMonth ?? undefined,
        monthlyWeekday: t.monthlyWeekday ?? undefined,
      },
    ],
  }));
  return {
    workType: a.assignmentType,
    siteId: a.siteId,
    shiftId: a.shiftId ?? "",
    date: a.startDate,
    startTime: (a.startTime ?? "").slice(0, 5),
    poId: a.poId ?? "",
    templateName: "",
    groups,
    cleanerIds: [],
    profileIds: [],
    supervisorIds: Array.from(new Set(a.tasks.flatMap((t) => t.supervisors.map((s) => s.id)))),
    assignPerTask: a.tasks.some((t) => t.cleaners.length > 0),
    recurrenceType: a.recurrenceType ?? undefined,
    recurrenceCount: a.recurrenceInterval ?? undefined,
    daysOfWeek: a.daysOfWeek ?? [],
    monthlyMode: a.weekOfMonth != null ? "DAY_OF_WEEK" : "DAY_OF_MONTH",
    dayOfMonth: a.dayOfMonth ?? undefined,
    weekOfMonth: a.weekOfMonth ?? undefined,
    monthlyWeekday: a.monthlyWeekday ?? undefined,
    otherRepeatWorkingDays: a.otherRepeatWorkingDays,
    otherUseRecurrence: a.otherUseRecurrence,
    generalUseRecurrence: a.generalUseRecurrence,
  };
}

/** Build a CREATE form seeded from one existing task (scope-view task-row "+").
 *  Loads the task's details; `oneOff` drops all recurrence (date-view), otherwise the
 *  source task/assignment recurrence is kept (day-view "same as loaded task"). */
export function taskToCreateFormInput(
  a: Assignment,
  taskId: string,
  opts: { oneOff: boolean; date: string },
): AssignmentFormInput | null {
  const full = assignmentToFormInput(a);
  const group = full.groups.find((g) => g.tasks.some((t) => t.id === taskId));
  const task = group?.tasks.find((t) => t.id === taskId);
  const raw = a.tasks.find((t) => t.id === taskId);
  if (!group || !task || !raw) return null;

  // Carry the source task's responsibility. Profile slots are the preferred unit (the
  // backend derives cleaners from them); fall back to direct cleaners when it has no slots.
  const profileIds = raw.profiles.map((p) => p.id);
  const cleanerIds = profileIds.length > 0 ? [] : raw.cleaners.map((c) => c.id);
  const supervisorIds = raw.supervisors.map((s) => s.id);

  const newTask: GroupTaskFormInput = {
    ...task,
    id: undefined, // strip id → create a new task, not edit the source
    cleanerIds,
    profileIds,
    items: [], // a scope-view add is just the task — no expected items
    ...(opts.oneOff
      ? {
          recurrenceType: undefined,
          recurrenceInterval: undefined,
          daysOfWeek: [],
          dayOfMonth: undefined,
          weekOfMonth: undefined,
          monthlyWeekday: undefined,
        }
      : {}),
  };
  const oneGroup: LocationGroupFormInput = {
    floorId: group.floorId,
    areaIds: group.areaIds,
    tasks: [newTask],
  };

  const shared = {
    groups: [oneGroup],
    date: opts.date,
    assignPerTask: false,
    cleanerIds,
    profileIds,
    supervisorIds,
  };

  if (opts.oneOff) {
    // Keep the source task's work type but produce exactly one occurrence on the clicked
    // date: seriesEndDate == startDate is a single day for working-day/one-time types, and
    // a DAILY(×1) rule bounded the same way is a single day for recurrence-based types.
    const usesRecurrence =
      full.workType === "PERIODICAL_TASK" ||
      (full.workType === "OTHER" && full.otherUseRecurrence) ||
      (full.workType === "GENERAL_TASK" && full.generalUseRecurrence);
    return {
      ...full,
      ...shared,
      seriesEndDate: opts.date,
      ...(usesRecurrence
        ? {
            recurrenceType: "DAILY" as const,
            recurrenceCount: 1,
            daysOfWeek: [],
            monthlyMode: "DAY_OF_MONTH" as const,
            dayOfMonth: undefined,
            weekOfMonth: undefined,
            monthlyWeekday: undefined,
          }
        : {}),
    };
  }
  return { ...full, ...shared };
}

/** All tasks across all groups, flattened — used for totals/end-time. */
export function allTasksOf(input: Pick<AssignmentFormInput, "groups">): GroupTaskFormInput[] {
  return input.groups.flatMap((g) => g.tasks);
}

/** Map the form to the backend CreateAssignmentRequest payload (flattens groups → tasks). */
export function toCreateAssignmentPayload(input: AssignmentFormInput): Record<string, unknown> {
  const usesRecurrence =
    input.workType === "PERIODICAL_TASK" ||
    (input.workType === "OTHER" && input.otherUseRecurrence) ||
    (input.workType === "GENERAL_TASK" && input.generalUseRecurrence);

  const payload: Record<string, unknown> = {
    siteId: input.siteId,
    ...(input.shiftId ? { shiftId: input.shiftId } : {}),
    assignmentType: input.workType,
    ...(input.workType === "WORK_ORDER" && input.poId?.trim()
      ? { poId: input.poId.trim() }
      : {}),
    ...(input.templateName?.trim() ? { templateName: input.templateName.trim() } : {}),
    startDate: input.date,
    ...(input.seriesEndDate ? { seriesEndDate: input.seriesEndDate } : {}),
    startTime: input.startTime.length === 5 ? `${input.startTime}:00` : input.startTime,
    tasks: input.groups.flatMap((group) =>
      group.tasks.flatMap((task) =>
        group.areaIds.map((areaId) => ({
          ...(task.id ? { id: task.id } : {}),
          name: task.name.trim(),
          ...(task.durationMinutes != null ? { durationMinutes: task.durationMinutes } : {}),
          floorId: group.floorId,
          areaId,
          ...(task.description?.trim() ? { description: task.description.trim() } : {}),
          cleanerIds: input.assignPerTask ? task.cleanerIds : input.cleanerIds,
          ...((input.assignPerTask ? task.profileIds : input.profileIds).length > 0
            ? { profileIds: input.assignPerTask ? task.profileIds : input.profileIds }
            : {}),
          ...(input.supervisorIds.length > 0 ? { supervisorIds: input.supervisorIds } : {}),
          ...((task.items ?? []).length > 0
            ? { items: task.items.map((it) => ({ itemId: it.itemId, quantity: it.quantity })) }
            : {}),
          ...(usesRecurrence && task.recurrenceType
            ? {
                recurrenceType: task.recurrenceType,
                recurrenceInterval: task.recurrenceInterval ?? 1,
                ...(task.recurrenceType === "WEEKLY" ? { daysOfWeek: task.daysOfWeek } : {}),
                ...(task.recurrenceType === "MONTHLY"
                  ? task.monthlyMode === "DAY_OF_WEEK"
                    ? { weekOfMonth: task.weekOfMonth, monthlyWeekday: task.monthlyWeekday }
                    : { dayOfMonth: task.dayOfMonth }
                  : {}),
              }
            : {}),
        })),
      ),
    ),
  };

  if (usesRecurrence) {
    payload.recurrenceType = input.recurrenceType;
    payload.recurrenceInterval = input.recurrenceCount;
    if (input.recurrenceType === "WEEKLY") payload.daysOfWeek = input.daysOfWeek;
    if (input.recurrenceType === "MONTHLY") {
      if (input.monthlyMode === "DAY_OF_WEEK") {
        payload.weekOfMonth = input.weekOfMonth;
        payload.monthlyWeekday = input.monthlyWeekday;
      } else {
        payload.dayOfMonth = input.dayOfMonth;
      }
    }
  }
  if (input.workType === "OTHER") {
    payload.otherRepeatWorkingDays = input.otherRepeatWorkingDays;
    payload.otherUseRecurrence = input.otherUseRecurrence;
  }
  if (input.workType === "GENERAL_TASK") {
    payload.generalUseRecurrence = input.generalUseRecurrence;
  }
  return payload;
}

/** Expected end time (HH:mm) = start + Σ task durations (default per task when unset). */
export function computeExpectedEndTime(startTime: string, tasks: GroupTaskFormInput[]): string | null {
  if (!startTime || tasks.length === 0) return null;
  const [h, m] = startTime.split(":").map(Number);
  if (h == null || Number.isNaN(h)) return null;
  const total = tasks.reduce(
    (sum, t) => sum + (t.durationMinutes ?? DEFAULT_TASK_DURATION_MINUTES),
    0,
  );
  const end = (h * 60 + (m ?? 0) + total) % (24 * 60);
  return `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
}
