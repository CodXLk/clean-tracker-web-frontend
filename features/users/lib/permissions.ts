import type { Role } from "@/features/users/schemas/user.schema";

// Mirrors the backend role-creation hierarchy in UserService.
const CREATABLE_ROLES: Record<Role, Role[]> = {
  SUPER_ADMIN: ["COMPANY_ADMIN"],
  COMPANY_ADMIN: ["CLIENT_SERVICE_MANAGER", "CLIENT", "SUPERVISOR", "CLEANER"],
  CLIENT_SERVICE_MANAGER: ["CLIENT", "SUPERVISOR", "CLEANER"],
  CLIENT: [],
  SUPERVISOR: [],
  CLEANER: [],
};

export function creatableRoles(role: Role | undefined): Role[] {
  return role ? CREATABLE_ROLES[role] : [];
}

export const COMPANY_MANAGER_ROLES = new Set<Role>(["SUPER_ADMIN", "COMPANY_ADMIN"]);
