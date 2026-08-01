"use client";

import { useEffect, useMemo, useState } from "react";
import { useMySites } from "@/features/attendance/hooks/useAttendance";
import type { CleanerSite } from "@/features/attendance/schemas/attendance.schema";

export interface ActiveSiteContext {
  sites: CleanerSite[];
  isLoading: boolean;
  /** Site the user is currently checked in to today, if any. */
  checkedInSiteId: string | null;
  /** The site whose data should be shown — the selection, falling back to check-in. */
  selectedSiteId: string | null;
  setSelectedSiteId: (siteId: string | null) => void;
}

/**
 * Resolves which site the cleaner/supervisor is working at: defaults to the
 * checked-in site, but lets the user switch between their assigned sites.
 */
export function useActiveSite(date?: string): ActiveSiteContext {
  const { data: sites = [], isLoading } = useMySites(date);

  const checkedInSiteId = useMemo(
    () => sites.find((s) => s.status === "CHECKED_IN")?.siteId ?? null,
    [sites],
  );

  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Until the user manually picks a site, track the checked-in site (or the first one).
  useEffect(() => {
    if (touched) return;
    const fallback = checkedInSiteId ?? sites[0]?.siteId ?? null;
    setSelectedSiteId(fallback);
  }, [checkedInSiteId, sites, touched]);

  return {
    sites,
    isLoading,
    checkedInSiteId,
    selectedSiteId,
    setSelectedSiteId: (siteId) => {
      setTouched(true);
      setSelectedSiteId(siteId);
    },
  };
}
