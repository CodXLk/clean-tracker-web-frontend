import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const strongPassword = z
  .string()
  .min(8, "Must be at least 8 characters")
  .max(100, "Too long");

export const AccountSetupSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    temporaryPassword: z.string().min(1, "Temporary password is required"),
    newPassword: strongPassword,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  password: strongPassword,
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type AccountSetupInput = z.infer<typeof AccountSetupSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
