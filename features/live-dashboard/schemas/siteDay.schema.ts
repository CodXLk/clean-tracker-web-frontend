import { z } from "zod";

export const SITE_DAY_STATUSES = [
  "SCHEDULED",
  "CLEANING_IN_PROGRESS",
  "CLEANING_PAUSED",
  "CLEANING_INCOMPLETE",
  "CLEANING_SKIPPED",
  "CARRIED_OVER",
  "PENDING_INSPECTION",
  "INSPECTION_SCHEDULED",
  "INSPECTION_IN_PROGRESS",
  "INSPECTION_PAUSED",
  "INSPECTION_SKIPPED",
  "COMPLETED",
] as const;
export type SiteDayStatus = (typeof SITE_DAY_STATUSES)[number];

const CleaningStatusSchema = z.enum([
  "NONE", "PENDING", "IN_PROGRESS", "PAUSED", "INCOMPLETE", "COMPLETED", "SKIPPED", "CARRIED_OVER",
]);
const InspectionStatusSchema = z.enum(["NONE", "PENDING", "IN_PROGRESS", "PAUSED", "COMPLETED", "SKIPPED"]);
const PersonStatusSchema = z.enum(["PENDING", "IN_PROGRESS", "PAUSED", "DONE", "SKIPPED"]);

const PauseSchema = z.object({
  pausedAt: z.string().nullish(),
  resumedAt: z.string().nullish(),
  reason: z.string().nullish(),
});

export const SiteDaySessionSchema = z.object({
  id: z.string().nullish(),
  status: z.string().nullish(),
  sessionType: z.string().nullish(),
  poId: z.string().nullish(),
  checkInAt: z.string().nullish(),
  checkOutAt: z.string().nullish(),
  closedAt: z.string().nullish(),
  pausedAt: z.string().nullish(),
  pausedMinutes: z.number().default(0),
  workedMinutes: z.number().nullish(),
  lateMinutes: z.number().nullish(),
  closeReason: z.string().nullish(),
  checkedOutBy: z.string().nullish(),
  checkoutNote: z.string().nullish(),
  scheduledStartAt: z.string().nullish(),
  scheduledEndAt: z.string().nullish(),
  pauses: z.array(PauseSchema).default([]),
});

export const SiteDayPersonSchema = z.object({
  id: z.string(),
  name: z.string(),
  expected: z.boolean().default(false),
  status: PersonStatusSchema,
  shiftStart: z.string().nullish(),
  shiftEnd: z.string().nullish(),
  shiftStartAt: z.string().nullish(),
  originalShiftStart: z.string().nullish(),
  originalShiftEnd: z.string().nullish(),
  moveMinutes: z.number().default(0),
  forcedCheckout: z.boolean().default(false),
  forgotCheckout: z.boolean().default(false),
  sessions: z.array(SiteDaySessionSchema).default([]),
});

// Mirrors backend SiteDayStatusResponse.
export const SiteDaySchema = z.object({
  siteId: z.string(),
  siteName: z.string(),
  date: z.string(),
  timezone: z.string().nullish(),
  current: z.boolean().default(false),
  workOrderSite: z.boolean().default(false),
  status: z.enum(SITE_DAY_STATUSES),
  cleaningStatus: CleaningStatusSchema,
  inspectionStatus: InspectionStatusSchema,
  cleaningScheduled: z.boolean().default(false),
  inspectionScheduled: z.boolean().default(false),
  carriedFrom: z.string().nullish(),
  carriedTo: z.string().nullish(),
  inspectedOn: z.string().nullish(),
  totalTasks: z.number().default(0),
  completedTasks: z.number().default(0),
  generalStart: z.string().nullish(),
  generalEnd: z.string().nullish(),
  expectedStart: z.string().nullish(),
  expectedEnd: z.string().nullish(),
  expectedStartAt: z.string().nullish(),
  expectedSource: z.enum(["SHIFT", "GENERAL", "TASKS"]).nullish(),
  shiftMoved: z.boolean().default(false),
  originalStart: z.string().nullish(),
  firstCheckInAt: z.string().nullish(),
  lastCheckOutAt: z.string().nullish(),
  cleaners: z.array(SiteDayPersonSchema).default([]),
  supervisors: z.array(SiteDayPersonSchema).default([]),
});
export const SiteDayListSchema = z.array(SiteDaySchema);

export type SiteDay = z.infer<typeof SiteDaySchema>;
export type SiteDayPerson = z.infer<typeof SiteDayPersonSchema>;
export type SiteDaySession = z.infer<typeof SiteDaySessionSchema>;
export type CleaningStatus = z.infer<typeof CleaningStatusSchema>;
export type InspectionStatus = z.infer<typeof InspectionStatusSchema>;
export type PersonStatus = z.infer<typeof PersonStatusSchema>;
