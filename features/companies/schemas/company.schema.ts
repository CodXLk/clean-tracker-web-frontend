import { z } from "zod";

// Mirrors backend CompanyResponse.
export const CompanySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  contactEmail: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  addressLine: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postcode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  createdAt: z.string().nullable().optional(),
});

export const CompanyListSchema = z.array(CompanySchema);

// Outbound create payload — matches CreateCompanyRequest.
export const CreateCompanySchema = z.object({
  name: z.string().min(2, "Company name is required").max(120),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  contactPhone: z.string().max(30).optional().or(z.literal("")),
  addressLine: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  postcode: z.string().optional().or(z.literal("")),
});

export type Company = z.infer<typeof CompanySchema>;
export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
