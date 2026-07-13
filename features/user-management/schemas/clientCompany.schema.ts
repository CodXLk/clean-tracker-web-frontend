import { z } from "zod";

// Mirrors backend ClientCompanyResponse.
export const ClientCompanySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  contactNumber: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const ClientCompanyListSchema = z.array(ClientCompanySchema);

// Outbound create/update payload — matches Create/UpdateClientCompanyRequest.
export const ClientCompanyFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120, "Name is too long"),
  contactNumber: z.string().max(30, "Contact number is too long").optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

export type ClientCompany = z.infer<typeof ClientCompanySchema>;
export type ClientCompanyFormInput = z.infer<typeof ClientCompanyFormSchema>;
