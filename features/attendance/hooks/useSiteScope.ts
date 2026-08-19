"use client";

import { useState } from "react";
import { useMe } from "@/features/auth/hooks/useMe";
import { useActiveSite } from "@/features/attendance/hooks/useActiveSite";
import type { CleanerSite } from "@/features/attendance/schemas/attendance.schema";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "COMPANY_ADMIN"]);

export interface SiteScope {
  isAdmin: boolean;
  sites: CleanerSite[];
  checkedInSiteId: string | null;
  /** null = all sites (admins default here); a specific id otherwise. */
  selectedSiteId: string | null;
  setSelectedSiteId: (siteId: string | null) => void;
}

interface SiteScopeOptions {
  /**
   * When true, admins default to the most recently created site (the first entry, since
   * the backend returns sites ordered by createdAt DESC) instead of "All sites".
   */
  defaultToLatestSite?: boolean;
}

/**
 * Role-aware site scoping for the Tasks / Inspections / Complaints list pages.
 * Cleaners/supervisors keep the assigned-site behaviour (defaults to their checked-in
 * or first site). Super/company admins see every site's data and default to "All sites",
 * narrowing with the admin site filter. The underlying data endpoints already return all
 * sites for management, so only the selection/default differs here.
 */
export function useSiteScope(date?: string, options?: SiteScopeOptions): SiteScope {
  const me = useMe();
  const isAdmin = ADMIN_ROLES.has(me.data?.role ?? "");
  const active = useActiveSite(date);
  const [adminSiteId, setAdminSiteId] = useState<string | null>(null);

  // Admins may default to the latest-created site rather than "All sites". The list is
  // ordered createdAt DESC by the backend, so the first entry is the most recent one.
  const adminSelected =
    adminSiteId ?? (options?.defaultToLatestSite ? active.sites[0]?.siteId ?? null : null);

  return {
    isAdmin,
    sites: active.sites,
    checkedInSiteId: active.checkedInSiteId,
    selectedSiteId: isAdmin ? adminSelected : active.selectedSiteId,
    setSelectedSiteId: isAdmin ? setAdminSiteId : active.setSelectedSiteId,
  };
}
