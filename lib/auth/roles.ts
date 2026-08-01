export const ADMIN_ROLES = new Set(["SUPER_ADMIN", "COMPANY_ADMIN", "CLIENT_SERVICE_MANAGER"]);

/** Admin-console routes a SUPERVISOR may access, despite not being a full admin. */
export const SUPERVISOR_ALLOWED_PREFIXES = [
  "/admin/workforce",
  "/admin/user-management",
  "/admin/cleaner-logs",
];

export function isAdminRole(role: string | null | undefined): boolean {
  return !!role && ADMIN_ROLES.has(role);
}

/** Whether a role may open the given /admin path (admins: all; supervisors: allow-listed). */
export function canAccessAdminPath(role: string | null | undefined, pathname: string): boolean {
  if (isAdminRole(role)) return true;
  if (role === "SUPERVISOR") {
    return SUPERVISOR_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p));
  }
  return false;
}


/** Landing route for a role: admins go to the console, everyone else to the cleaner app. */
export function landingPath(role: string | null | undefined): string {
  return isAdminRole(role) ? "/admin/dashboard" : "/dashboard";
}

/**
 * Reads the (unverified) `role` claim from a JWT payload. Used only for client-side
 * routing decisions — the backend still enforces real authorization on every request.
 */
export function roleFromToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    const claims = JSON.parse(json) as { role?: string };
    return claims.role ?? null;
  } catch {
    return null;
  }
}
