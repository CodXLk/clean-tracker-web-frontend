import { z } from "zod";
import { optionalAuPhoneSchema } from "@/lib/validators/phone";
import {
  UserDocumentSchema,
} from "@/features/users/schemas/document.schema";

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
  // All roles the user may operate as. Optional for backward compatibility with older payloads.
  roles: z.array(RoleSchema).optional().default([]),
  companyId: z.string().uuid().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  active: z.boolean(),
  setupComplete: z.boolean(),
  hasPhoto: z.boolean().optional().default(false),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
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
  phoneNumber: optionalAuPhoneSchema,
  dateOfBirth: z.string().optional().or(z.literal("")),
  roles: z.array(RoleSchema).min(1, "Select at least one role"),
});

// Replace the set of roles assigned to an existing user.
export const UpdateUserRolesSchema = z.object({
  roles: z.array(RoleSchema).min(1, "Select at least one role"),
});

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().max(50).optional(),
  phoneNumber: z.string().max(30).optional(),
  dateOfBirth: z.string().optional().or(z.literal("")),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UpdateUserRolesInput = z.infer<typeof UpdateUserRolesSchema>;

// Mirrors backend CleanerSiteSummaryResponse (used for cleaner/supervisor assigned sites).
export const AssignedSiteSummarySchema = z.object({
  siteId: z.string().uuid(),
  siteName: z.string(),
  clientName: z.string().nullable().optional(),
  clientCompanyName: z.string().nullable().optional(),
  siteType: z.string().nullable().optional(),
  slotLabel: z.string().nullable().optional(),
});
export type AssignedSiteSummary = z.infer<typeof AssignedSiteSummarySchema>;

// Mirrors backend UserDetailResponse.
export const UserDetailSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  role: RoleSchema,
  dateOfBirth: z.string().nullable().optional(),
  hasPhoto: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
  setupComplete: z.boolean().optional().default(false),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  documents: z.array(UserDocumentSchema).default([]),
  sites: z.array(AssignedSiteSummarySchema).default([]),
});
export type UserDetail = z.infer<typeof UserDetailSchema>;
