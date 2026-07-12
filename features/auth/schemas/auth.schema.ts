import { z } from "zod";

export const LoginSchema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z.object({
  name:     z.string().min(1, "Name is required").max(100, "Name too long"),
  email:    z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8,  "Must be at least 8 characters")
    .regex(/[A-Z]/,        "Must contain at least one uppercase letter")
    .regex(/[0-9]/,        "Must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Must contain at least one special character"),
});

export type LoginInput    = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
