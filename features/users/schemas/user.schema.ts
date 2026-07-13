import { z } from "zod";

// Roles mirror the Spring Boot `Role` enum.
export const ROLES = [
  "SUPER_ADMIN",
  "COMPANY_ADMIN",
  "CLIENT_SERVICE_MANAGER",
  "CLIENT",
  "SUPERVISOR",
  "CLEANER",
] as const;

export const RoleSchema = z.enum(ROLES);
export type Role = z.infer<typeof RoleSchema>;

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  COMPANY_ADMIN: "Company Admin",
  CLIENT_SERVICE_MANAGER: "Client Service Manager",
  CLIENT: "Client",
  SUPERVISOR: "Supervisor",
  CLEANER: "Cleaner",
};

// Mirrors backend UserResponse.
export const UserSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string().nullable().optional(),
  email: z.string().email(),
  phoneNumber: z.string().nullable().optional(),
  role: RoleSchema,
  companyId: z.string().uuid().nullable().optional(),
  active: z.boolean(),
  setupComplete: z.boolean(),
  createdAt: z.string().nullable().optional(),
});

export const UserListSchema = z.array(UserSchema);

// Outbound create payload — matches CreateUserRequest.
export const CreateUserSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().max(50).optional().or(z.literal("")),
    email: z.string().email("A valid email is required"),
    phoneNumber: z.string().max(30).optional().or(z.literal("")),
    role: RoleSchema,
    companyId: z.string().uuid("Select a client company").optional(),
  })
  .refine((data) => data.role !== "CLIENT" || !!data.companyId, {
    message: "A client must be linked to a client company",
    path: ["companyId"],
  });

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().max(50).optional(),
  phoneNumber: z.string().max(30).optional(),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
