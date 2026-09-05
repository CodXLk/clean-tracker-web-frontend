import type { Role } from "@/features/users/schemas/user.schema";

// Mirrors the backend role-creation hierarchy in UserService.
// CLIENT is deliberately excluded from every entry: client users are only ever
// provisioned via Client Management, never manually invited from this form.
const CREATABLE_ROLES: Record<Role, Role[]> = {
  SUPER_ADMIN: ["COMPANY_ADMIN", "CLIENT_SERVICE_MANAGER", "SUPERVISOR", "CLEANER"],
  COMPANY_ADMIN: ["CLIENT_SERVICE_MANAGER", "SUPERVISOR", "CLEANER"],
  CLIENT_SERVICE_MANAGER: ["SUPERVISOR", "CLEANER"],
  CLIENT: [],
  SUPERVISOR: [],
  CLEANER: [],
};

export function creatableRoles(role: Role | undefined): Role[] {
  return role ? CREATABLE_ROLES[role] : [];
}

export const COMPANY_MANAGER_ROLES = new Set<Role>(["SUPER_ADMIN", "COMPANY_ADMIN"]);

// Same hierarchy tier as the roles above, scoped to Cleaner Management instead of
// the general Users invite flow.
const CLEANER_MANAGER_ROLES = new Set<Role>(["SUPER_ADMIN", "COMPANY_ADMIN", "CLIENT_SERVICE_MANAGER"]);

export function canManageCleaners(role: Role | undefined): boolean {
  return !!role && CLEANER_MANAGER_ROLES.has(role);
}
