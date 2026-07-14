import { z } from "zod";
import { optionalAuMobileSchema } from "@/lib/validators/phone";

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
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const SiteListSchema = z.array(SiteSchema);

// Outbound create/update payload — matches Create/UpdateSiteRequest.
export const SiteFormSchema = z.object({
  clientCompanyId: z.string().uuid("Please select a client-company"),
  clientId: z.string().uuid("Please select a client"),
  name: z.string().min(2, "Name must be at least 2 characters").max(150, "Name is too long"),
  contactPersonName: z.string().max(120, "Name is too long").optional().or(z.literal("")),
  contactNumber: optionalAuMobileSchema,
  googleMapsLink: z.string().max(2048, "Link is too long").optional().or(z.literal("")),
  streetAddress: z.string().max(1024, "Address is too long").optional().or(z.literal("")),
});

export type Site = z.infer<typeof SiteSchema>;
export type SiteFormInput = z.infer<typeof SiteFormSchema>;
