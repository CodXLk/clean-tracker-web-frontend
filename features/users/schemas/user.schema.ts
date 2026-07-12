import { z } from "zod";

export const UserSchema = z.object({
  id:        z.string().uuid(),
  name:      z.string().min(1, "Name is required"),
  email:     z.string().email("Invalid email address"),
  role:      z.enum(["ADMIN", "USER", "MODERATOR"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const UserListSchema = z.array(UserSchema);

export const CreateUserSchema = z.object({
  name:     z.string().min(1, "Name is required").max(100, "Name too long"),
  email:    z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8,  "Must be at least 8 characters")
    .regex(/[A-Z]/,        "Must contain at least one uppercase letter")
    .regex(/[0-9]/,        "Must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Must contain at least one special character"),
  role:     z.enum(["ADMIN", "USER", "MODERATOR"]).default("USER"),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true });

export type User            = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
