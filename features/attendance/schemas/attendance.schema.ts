import { z } from "zod";

export const CheckInMethodSchema = z.enum(["NFC", "GEO"]);
export type CheckInMethod = z.infer<typeof CheckInMethodSchema>;

export const AttendanceStatusSchema = z.enum(["CHECKED_IN", "CHECKED_OUT"]);
export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>;

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
});
export const CleanerSiteListSchema = z.array(CleanerSiteSchema);
export type CleanerSite = z.infer<typeof CleanerSiteSchema>;

// Mirrors backend AttendanceLogResponse.
export const AttendanceLogSchema = z.object({
  id: z.string().uuid(),
  cleanerId: z.string().uuid(),
  cleanerName: z.string().nullable().optional(),
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
}
