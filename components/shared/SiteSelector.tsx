"use client";

import { useMemo } from "react";
import {
  SearchableSelect,
  type SelectOption,
} from "@/features/user-management/components/SearchableSelect";
import type { CleanerSite } from "@/features/attendance/schemas/attendance.schema";

interface SiteSelectorProps {
  sites: CleanerSite[];
  selectedSiteId: string | null;
  onChange: (siteId: string) => void;
  checkedInSiteId?: string | null;
  className?: string;
}

/**
 * Dropdown to pick which assigned site's data is shown. Defaults to the checked-in
 * site; hidden when the user has fewer than two sites.
 */
export function SiteSelector({
  sites,
  selectedSiteId,
  onChange,
  checkedInSiteId,
  className,
}: SiteSelectorProps) {
  const options = useMemo<SelectOption[]>(
    () =>
      sites.map((site) => ({
        value: site.siteId,
        label: site.siteName,
        sublabel: site.siteId === checkedInSiteId ? "Checked in" : undefined,
      })),
    [sites, checkedInSiteId],
  );

  if (sites.length < 2) return null;

  return (
    <div className={className}>
      <SearchableSelect
        options={options}
        value={selectedSiteId}
        onChange={onChange}
        placeholder="Select site"
        searchable={false}
      />
    </div>
  );
}
