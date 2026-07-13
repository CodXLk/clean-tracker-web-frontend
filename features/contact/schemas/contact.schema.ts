import { z } from "zod";

export const ContactSchema = z.object({
  name:    z.string().min(1, "Name is required").max(100, "Name too long"),
  email:   z.string().email("Invalid email address"),
  phone:   z.string().optional(),
  message: z.string().min(10, "Tell us a little more about what you need").max(2000, "Message too long"),
});

export type ContactInput = z.infer<typeof ContactSchema>;
