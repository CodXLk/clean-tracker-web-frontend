export const ADMIN_ROLES = new Set(["SUPER_ADMIN", "COMPANY_ADMIN", "CLIENT_SERVICE_MANAGER"]);

export function isAdminRole(role: string | null | undefined): boolean {
  return !!role && ADMIN_ROLES.has(role);
}

/**
 * Super admins, company admins and clients get an account-only profile: no compliance documents and
 * no field work stats (tasks, hours, rating, days active).
 */
const ACCOUNT_PROFILE_ROLES = new Set(["SUPER_ADMIN", "COMPANY_ADMIN", "CLIENT"]);

export function hasAccountOnlyProfile(role: string | null | undefined): boolean {
  return !!role && ACCOUNT_PROFILE_ROLES.has(role);
}

/** Every signed-in user may change their own email from the profile (confirmed with their password). */
export function canChangeOwnEmail(role: string | null | undefined): boolean {
  return !!role;
}
/**
 * Super admins and company admins change sign-in emails directly — their own (with their password) and,
 * as a recovery path, those of people they manage — with no verification code. Everyone else verifies a
 * new address with a code emailed to it. Mirrors the API rules.
 */
export function changesEmailWithoutVerification(role: string | null | undefined): boolean {
  return role === "SUPER_ADMIN" || role === "COMPANY_ADMIN";
}

export function canCorrectUserEmails(role: string | null | undefined): boolean {
  return changesEmailWithoutVerification(role);
}

/** Landing route for a role: admins and clients go to the console, everyone else to the cleaner app. */
export function landingPath(role: string | null | undefined): string {
  return isAdminRole(role) || role === "CLIENT" ? "/admin/dashboard" : "/dashboard";
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

/**
 * True when the access JWT's `exp` claim is in the past (or unreadable). The access cookie
 * outlives the JWT so full-page navigations can self-heal via a silent refresh — but an expired
 * token must NOT count as a live session when deciding whether to bounce a user off the login page.
 */
export function isAccessTokenExpired(token: string | undefined | null): boolean {
  if (!token) return true;
  const payload = token.split(".")[1];
  if (!payload) return true;
  try {
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    const claims = JSON.parse(json) as { exp?: number };
    if (typeof claims.exp !== "number") return false; // no exp → let the backend decide
    return claims.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

/**
 * Root hrefs of the only Admin Panel sections a SUPERVISOR may access. This is the
 * single source of truth for that restriction — AppNav.tsx filters the nav against
 * it, and proxy.ts enforces it at the route level so a Supervisor can't reach a
 * hidden section by typing its URL directly.
 */
export const SUPERVISOR_ALLOWED_HREFS = [
  "/dashboard",
  "/dashboard/inspections",
  "/dashboard/leave",
  "/dashboard/announcements",
  "/admin/complaints",
  "/admin/inventory",
  "/admin/cleaner-management",
  "/admin/workforce",
  "/admin/cleaner-logs",
  "/admin/user-management/sites",
  "/dashboard/invoices",
  "/dashboard/profile",
] as const;

/** "/dashboard" (Home) only matches exactly; every other entry also allows its subroutes. */
export function isSupervisorRouteAllowed(pathname: string): boolean {
  return SUPERVISOR_ALLOWED_HREFS.some(
    (href) => pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`)),
  );
}

/**
 * Root hrefs of the client portal. AppNav builds the client nav from these and proxy.ts blocks
 * clients from every other protected route (e.g. Workforce, which shows internal staffing).
 */
export const CLIENT_ALLOWED_HREFS = [
  "/admin/dashboard",
  "/admin/complaints",
  "/admin/client-work-orders",
  "/admin/item-requests",
  "/admin/client-site-management",
  "/admin/client-invoices",
  "/dashboard/profile",
  "/dashboard/notifications",
  "/admin/notifications",
] as const;

export function isClientRouteAllowed(pathname: string): boolean {
  return CLIENT_ALLOWED_HREFS.some((href) => pathname === href || pathname.startsWith(`${href}/`));
}