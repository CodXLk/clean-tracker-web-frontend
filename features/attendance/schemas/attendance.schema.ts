import { z } from "zod";

export const CheckInMethodSchema = z.enum(["NFC", "GEO"]);
export type CheckInMethod = z.infer<typeof CheckInMethodSchema>;

export const AttendanceStatusSchema = z.enum(["CHECKED_IN", "PAUSED", "CHECKED_OUT", "FORCED_CHECKOUT"]);
export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>;

// A site's work shift window — used to gate/label check-in by shift.
export const ShiftWindowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  crossesMidnight: z.boolean(),
});
export type ShiftWindow = z.infer<typeof ShiftWindowSchema>;

// Mirrors backend CleanerSiteResponse — a site the cleaner is assigned to plus
// today's check-in status. Never includes the raw NFC tag id.
export const CleanerSiteSchema = z.object({
  siteId: z.string().uuid(),
  siteName: z.string(),
  streetAddress: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  geofenceRadiusMeters: z.number().nullable().optional(),
  nfcRegistered: z.boolean(),
  hasCoordinates: z.boolean(),
  date: z.string(),
  status: AttendanceStatusSchema.nullable().optional(),
  checkInAt: z.string().nullable().optional(),
  checkOutAt: z.string().nullable().optional(),
  pausedAt: z.string().nullable().optional(),
  awayDistanceMeters: z.number().nullable().optional(),
  lastPingAt: z.string().nullable().optional(),
  lastPingDistanceMeters: z.number().nullable().optional(),
  shifts: z.array(ShiftWindowSchema).default([]),
  checkInAllowed: z.boolean().default(true),
  timezone: z.string().nullable().optional(),
  workOrderSite: z.boolean().optional().default(false),
  minimumWorkMinutes: z.number().nullable().optional(),
  enforceShiftWindow: z.boolean().optional().default(false),
  shift: z
    .object({
      date: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      originalStart: z.string().nullable().optional(),
      moveMinutes: z.number().default(0),
      startAt: z.string(),
      endAt: z.string(),
      checkInOpensAt: z.string(),
      checkInClosesAt: z.string(),
      inProgress: z.boolean(),
    })
    .nullable()
    .optional(),
  generalCheckInAllowed: z.boolean().optional().default(true),
  generalMember: z.boolean().optional().default(true),
  workOrders: z
    .array(
      z.object({
        id: z.string().uuid(),
        poId: z.string(),
        description: z.string().nullable().optional(),
        windowStart: z.string().nullable().optional(),
        windowEnd: z.string().nullable().optional(),
        checkInOpensAt: z.string().nullable().optional(),
        checkInAllowed: z.boolean(),
      }),
    )
    .default([]),
  sessionType: z.enum(["GENERAL", "WORK_ORDER"]).nullable().optional(),
  workOrderId: z.string().uuid().nullable().optional(),
  poId: z.string().nullable().optional(),
  pausedMinutes: z.number().optional().default(0),
});
export const CleanerSiteListSchema = z.array(CleanerSiteSchema);
export type CleanerSite = z.infer<typeof CleanerSiteSchema>;

// Mirrors backend AttendanceLogResponse.
export const AttendanceLogSchema = z.object({
  id: z.string().uuid(),
  cleanerId: z.string().uuid().nullable().optional(),
  cleanerName: z.string().nullable().optional(),
  actorRole: z.enum(["CLEANER", "SUPERVISOR"]).nullable().optional(),
  siteId: z.string().uuid(),
  siteName: z.string(),
  siteLatitude: z.number().nullable().optional(),
  siteLongitude: z.number().nullable().optional(),
  occurrenceDate: z.string(),
  status: AttendanceStatusSchema,
  checkInAt: z.string().nullable().optional(),
  checkInMethod: CheckInMethodSchema.nullable().optional(),
  checkInLatitude: z.number().nullable().optional(),
  checkInLongitude: z.number().nullable().optional(),
  checkInDistanceMeters: z.number().nullable().optional(),
  checkOutAt: z.string().nullable().optional(),
  checkOutMethod: CheckInMethodSchema.nullable().optional(),
  checkOutLatitude: z.number().nullable().optional(),
  checkOutLongitude: z.number().nullable().optional(),
  checkOutDistanceMeters: z.number().nullable().optional(),
  pausedAt: z.string().nullable().optional(),
  resumedAt: z.string().nullable().optional(),
  awayDistanceMeters: z.number().nullable().optional(),
  lastPingAt: z.string().nullable().optional(),
  lastPingLatitude: z.number().nullable().optional(),
  lastPingLongitude: z.number().nullable().optional(),
  lastPingDistanceMeters: z.number().nullable().optional(),
  sessionType: z.enum(["GENERAL", "WORK_ORDER"]).nullable().optional(),
  workOrderId: z.string().uuid().nullable().optional(),
  poId: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  scheduledStartAt: z.string().nullable().optional(),
  scheduledEndAt: z.string().nullable().optional(),
  lateMinutes: z.number().nullable().optional(),
  pausedMinutes: z.number().optional().default(0),
  grossMinutes: z.number().nullable().optional(),
  workedMinutes: z.number().nullable().optional(),
  closeReason: z.string().nullable().optional(),
  leaveCoverId: z.string().uuid().nullable().optional(),
  coveredCleanerId: z.string().uuid().nullable().optional(),
});
export const AttendanceLogListSchema = z.array(AttendanceLogSchema);
export type AttendanceLog = z.infer<typeof AttendanceLogSchema>;

export interface CheckInPayload {
  siteId: string;
  method: CheckInMethod;
  nfcTagId?: string;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  /** Cleaner consents to checking out with incomplete tasks. */
  acknowledgeIncomplete?: boolean;
  /** Cleaner confirms a forced check-out (incomplete tasks and/or before the shift ends). */
  force?: boolean;
  /** Work order (PO) being checked in for; omitted for general cleaning. */
  workOrderId?: string;
}

/** Periodic location heartbeat sent while checked in. When the location can't be obtained,
 *  send {@link HeartbeatPayload.unreachable} = true (no coordinates) to pause the shift. */
export interface HeartbeatPayload {
  siteId: string;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  unreachable?: boolean;
}
