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
