import { z } from "zod";
import { optionalAuMobileSchema } from "@/lib/validators/phone";

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

// Mirrors backend SiteResponse.
export const SiteSchema = z.object({
  id: z.string().uuid(),
  clientCompanyId: z.string().uuid(),
  clientCompanyName: z.string(),
  clientId: z.string().uuid(),
  clientName: z.string(),
  name: z.string(),
  contactPersonName: z.string().nullable().optional(),
  contactNumber: z.string().nullable().optional(),
  googleMapsLink: z.string().nullable().optional(),
  streetAddress: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(), // ISO date (yyyy-MM-dd)
  endDate: z.string().nullable().optional(),
  workingDays: z.array(DayOfWeekSchema).default([]),
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
    contactPersonName: z.string().max(120, "Name is too long").optional().or(z.literal("")),
    contactNumber: optionalAuMobileSchema,
    googleMapsLink: z.string().max(2048, "Link is too long").optional().or(z.literal("")),
    streetAddress: z.string().max(1024, "Address is too long").optional().or(z.literal("")),
    startDate: z.string().optional().or(z.literal("")),
    endDate: z.string().optional().or(z.literal("")),
    workingDays: z.array(DayOfWeekSchema),
  })
  .superRefine((val, ctx) => {
    if (val.startDate && val.endDate && val.endDate < val.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date cannot be before the start date",
        path: ["endDate"],
      });
    }
  });

export type Site = z.infer<typeof SiteSchema>;
export type SiteFormInput = z.infer<typeof SiteFormSchema>;
