import { z } from "zod";
import { optionalAuPhoneSchema } from "@/lib/validators/phone";

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
// Email is required: creating a client also provisions a CLIENT-role login for them.
export const ClientFormSchema = z.object({
  clientCompanyId: z.string().uuid("Please select a client-company"),
  name: z.string().min(2, "Name must be at least 2 characters").max(120, "Name is too long"),
  contactNumber: optionalAuPhoneSchema,
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

export type Client = z.infer<typeof ClientSchema>;
export type ClientFormInput = z.infer<typeof ClientFormSchema>;
