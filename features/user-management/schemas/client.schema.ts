import { z } from "zod";

// Mirrors backend ClientResponse.
export const ClientSchema = z.object({
  id: z.string().uuid(),
  clientCompanyId: z.string().uuid(),
  clientCompanyName: z.string(),
  name: z.string(),
  contactNumber: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const ClientListSchema = z.array(ClientSchema);

// Outbound create/update payload — matches Create/UpdateClientRequest.
export const ClientFormSchema = z.object({
  clientCompanyId: z.string().uuid("Please select a client-company"),
  name: z.string().min(2, "Name must be at least 2 characters").max(120, "Name is too long"),
  contactNumber: z.string().max(30, "Contact number is too long").optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

export type Client = z.infer<typeof ClientSchema>;
export type ClientFormInput = z.infer<typeof ClientFormSchema>;
