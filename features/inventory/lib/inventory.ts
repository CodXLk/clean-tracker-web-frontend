import type { User } from "@/features/users/schemas/user.schema";
import { formatDate, formatDateTime } from "@/lib/utils/format";

/** Roles that can approve requests, dispatch stock and edit the catalog. */
export function isManagement(role?: string): boolean {
  return role === "SUPER_ADMIN" || role === "COMPANY_ADMIN" || role === "CLIENT_SERVICE_MANAGER";
}

export function isManagementUser(user?: User | null): boolean {
  return isManagement(user?.role);
}

/** Trim trailing zeros for display, e.g. 2.500 → "2.5", 10.000 → "10". */
export function fmtQty(value: number | null | undefined): string {
  if (value == null) return "—";
  return Number(value.toFixed(3)).toString();
}

export function fmtMoney(value: number | null | undefined): string {
  if (value == null) return "—";
  return `$${value.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtDateTime(iso?: string | null): string {
  return formatDateTime(iso) || "—";
}

export function fmtDate(iso?: string | null): string {
  return formatDate(iso) || "—";
}
