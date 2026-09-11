import { z } from "zod";
import { optionalAuPhoneSchema } from "@/lib/validators/phone";
import { CertificateTypeSchema } from "@/features/users/schemas/document.schema";

// Java DayOfWeek names, ordered Monday-first to match the backend enum.
export const DAY_OF_WEEK_VALUES = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export const DayOfWeekSchema = z.enum(DAY_OF_WEEK_VALUES);
export type DayOfWeek = z.infer<typeof DayOfWeekSchema>;

// Mirrors backend GeneralTaskTimeMode enum.
export const GENERAL_TASK_TIME_MODE_VALUES = ["SINGLE", "PER_DAY"] as const;
export const GeneralTaskTimeModeSchema = z.enum(GENERAL_TASK_TIME_MODE_VALUES);
export type GeneralTaskTimeMode = z.infer<typeof GeneralTaskTimeModeSchema>;

// One per-day General-task service window — mirrors backend GeneralTaskDayTimeResponse.
export const GeneralTaskDayTimeSchema = z.object({
  dayOfWeek: DayOfWeekSchema,
  startTime: z.string(), // HH:mm[:ss]
  endTime: z.string(),
});
export type GeneralTaskDayTime = z.infer<typeof GeneralTaskDayTimeSchema>;

// Mirrors backend SiteType enum.
export const SITE_TYPE_VALUES = [
  "GENERAL",
  "HOTEL",
  "HOSPITAL",
  "OFFICE",
  "RETAIL",
  "SCHOOL",
  "RESTAURANT",
  "BUILDING_CLEANING",
] as const;

export const SiteTypeSchema = z.enum(SITE_TYPE_VALUES);
export type SiteType = z.infer<typeof SiteTypeSchema>;

export const SITE_TYPE_LABELS: Record<SiteType, string> = {
  GENERAL: "General cleaning site",
  HOTEL: "Hotel",
  HOSPITAL: "Hospital",
  OFFICE: "Office",
  RETAIL: "Retail",
  SCHOOL: "School",
  RESTAURANT: "Restaurant",
  BUILDING_CLEANING: "Building cleaning site",
};

// A General-task shift assigned to a cleaner slot — mirrors backend AssignedShift.
export const AssignedShiftSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  dayOfWeek: DayOfWeekSchema.nullable().optional(),
  startTime: z.string(),
  endTime: z.string(),
  crossesMidnight: z.boolean(),
});
export type AssignedShift = z.infer<typeof AssignedShiftSchema>;

// One cleaner slot (profile) on a site — mirrors backend SiteCleanerProfileResponse.
export const SiteCleanerProfileSchema = z.object({
  id: z.string().uuid(),
  profileIndex: z.number(),
  label: z.string(),
  cleanerId: z.string().uuid().nullable().optional(),
  cleanerName: z.string().nullable().optional(),
  taskCount: z.number().nullable().optional(),
  shifts: z.array(AssignedShiftSchema).default([]),
});
export type SiteCleanerProfile = z.infer<typeof SiteCleanerProfileSchema>;

// One supervisor slot (profile) on a site — mirrors backend SiteSupervisorProfileResponse.
export const SiteSupervisorProfileSchema = z.object({
  id: z.string().uuid(),
  profileIndex: z.number(),
  label: z.string(),
  supervisorId: z.string().uuid().nullable().optional(),
  supervisorName: z.string().nullable().optional(),
});
export type SiteSupervisorProfile = z.infer<typeof SiteSupervisorProfileSchema>;

// One cleaning-schedule template mapped to a site — mirrors backend CleaningTemplateResponse.
export const SiteCleaningTemplateSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid(),
  templateName: z.string().nullable().optional(),
  profileIndexes: z.array(z.number()).default([]),
  items: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        itemName: z.string(),
        unit: z.string(),
        quantity: z.number(),
      }),
    )
    .default([]),
});
export type SiteCleaningTemplate = z.infer<typeof SiteCleaningTemplateSchema>;

// Mirrors backend SiteResponse.
export const SiteSchema = z.object({
  id: z.string().uuid(),
  clientCompanyId: z.string().uuid(),
  clientCompanyName: z.string(),
  clientId: z.string().uuid(),
  clientName: z.string(),
  name: z.string(),
  siteType: SiteTypeSchema.default("GENERAL"),
  numberOfCleaners: z.number().default(0),
  contactPersonName: z.string().nullable().optional(),
  contactNumber: z.string().nullable().optional(),
  googleMapsLink: z.string().nullable().optional(),
  streetAddress: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  geofenceRadiusMeters: z.number().nullable().optional(),
  nfcTagId: z.string().nullable().optional(),
  nfcRegistered: z.boolean().optional(),
  startDate: z.string().nullable().optional(), // ISO date (yyyy-MM-dd)
  endDate: z.string().nullable().optional(),
  workingDays: z.array(DayOfWeekSchema).default([]),
  generalTaskTimeMode: GeneralTaskTimeModeSchema.default("SINGLE"),
  generalTaskStartTime: z.string().nullable().optional(),
  generalTaskEndTime: z.string().nullable().optional(),
  generalTaskDayTimes: z.array(GeneralTaskDayTimeSchema).default([]),
  requiredCertificates: z.array(CertificateTypeSchema).default([]),
  clientSiteManagementEnabled: z.boolean().optional().default(false),
  worksOnPublicHolidays: z.boolean().optional().default(false),
  workOrderSite: z.boolean().optional().default(false),
  cleanerProfiles: z.array(SiteCleanerProfileSchema).default([]),
  cleaningTemplates: z.array(SiteCleaningTemplateSchema).default([]),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const SiteListSchema = z.array(SiteSchema);

// Outbound create/update payload — matches Create/UpdateSiteRequest.
export const SiteFormSchema = z
  .object({
    clientCompanyId: z.string().uuid("Please select a client-company"),
    clientId: z.string().uuid("Please select a client"),
    name: z.string().min(2, "Name must be at least 2 characters").max(150, "Name is too long"),
    siteType: SiteTypeSchema,
    numberOfCleaners: z
      .number()
      .int()
      .min(0, "Cannot be negative")
      .max(100, "That is too many cleaners"),
    contactPersonName: z.string().max(120, "Name is too long").optional().or(z.literal("")),
    contactNumber: optionalAuPhoneSchema,
    googleMapsLink: z.string().max(2048, "Link is too long").optional().or(z.literal("")),
    streetAddress: z.string().max(1024, "Address is too long").optional().or(z.literal("")),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    geofenceRadiusMeters: z
      .number()
      .int()
      .positive("Radius must be a positive number of meters")
      .nullable()
      .optional(),
    nfcTagId: z.string().max(128, "NFC tag id is too long").optional().or(z.literal("")),
    startDate: z.string().optional().or(z.literal("")),
    endDate: z.string().optional().or(z.literal("")),
    workingDays: z.array(DayOfWeekSchema),
    generalTaskTimeMode: GeneralTaskTimeModeSchema,
    generalTaskStartTime: z.string().optional().or(z.literal("")),
    generalTaskEndTime: z.string().optional().or(z.literal("")),
    generalTaskDayTimes: z.array(
      z.object({
        dayOfWeek: DayOfWeekSchema,
        startTime: z.string().optional().or(z.literal("")),
        endTime: z.string().optional().or(z.literal("")),
      }),
    ),
    requiredCertificates: z.array(CertificateTypeSchema),
    clientSiteManagementEnabled: z.boolean().optional(),
    worksOnPublicHolidays: z.boolean().optional(),
    workOrderSite: z.boolean().optional(),
    cleaningTemplates: z.array(
      z.object({
        templateId: z.string().uuid("Please select a template"),
        profileIndexes: z.array(z.number().int()),
      }),
    ),
  })
  .superRefine((val, ctx) => {
    if (val.startDate && val.endDate && val.endDate < val.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date cannot be before the start date",
        path: ["endDate"],
      });
    }
    // General task end may be earlier than start — that means an overnight window (next day).
    // Only reject when a start is given without an end, or vice versa.
    const gStart = val.generalTaskStartTime as string | undefined;
    const gEnd = val.generalTaskEndTime as string | undefined;
    if (val.generalTaskTimeMode !== "PER_DAY" && Boolean(gStart) !== Boolean(gEnd)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Set both a start and end time (or leave both empty)",
        path: [gStart ? "generalTaskEndTime" : "generalTaskStartTime"],
      });
    }
    // In PER_DAY mode, every configured day must have both a start and end time.
    if (val.generalTaskTimeMode === "PER_DAY") {
      (val.generalTaskDayTimes ?? []).forEach((d, i) => {
        const hasStart = Boolean(d.startTime);
        const hasEnd = Boolean(d.endTime);
        if (hasStart !== hasEnd) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Set both a start and end time for this day",
            path: ["generalTaskDayTimes", i, hasStart ? "endTime" : "startTime"],
          });
        }
      });
    }
  });

export type Site = z.infer<typeof SiteSchema>;
export type SiteFormInput = z.infer<typeof SiteFormSchema>;
