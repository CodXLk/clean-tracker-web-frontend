import { z } from "zod";
import { optionalAuMobileSchema } from "@/lib/validators/phone";

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

// Dynamic role option returned by GET /api/v1/roles. SUPER_ADMIN is excluded server-side.
export const RoleOptionSchema = z.object({
  name: RoleSchema,
  label: z.string(),
});

export const RoleOptionListSchema = z.array(RoleOptionSchema);
export type RoleOption = z.infer<typeof RoleOptionSchema>;

// Outbound create payload — matches CreateUserRequest.
// CLIENT is not a valid value here: client users are only provisioned via Client Management,
// never through this manual invite form (the Role dropdown never offers it).
export const CreateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().max(50).optional().or(z.literal("")),
  email: z.string().email("A valid email is required"),
  phoneNumber: optionalAuMobileSchema,
  role: RoleSchema,
});

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().max(50).optional(),
  phoneNumber: z.string().max(30).optional(),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
