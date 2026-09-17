"use client";

import { useMemo } from "react";
import { SiteFilterSelect } from "@/components/admin/SiteFilterSelect";
import type { CleanerSite } from "@/features/attendance/schemas/attendance.schema";

interface AdminSiteFilterProps {
  sites: CleanerSite[];
  /** null = all sites. */
  value: string | null;
  onChange: (siteId: string | null) => void;
  className?: string;
  /** When false, the "All sites" option is hidden and only individual sites are selectable. */
  allowAllSites?: boolean;
}

/**
 * Site filter for management views. Uses the workforce {@link SiteFilterSelect} styling (styled
 * popover, no native select) but without the type-ahead search. Adds an "All sites" option
 * (an empty value) when {@code allowAllSites}.
 */
export function AdminSiteFilter({ sites, value, onChange, className, allowAllSites = true }: AdminSiteFilterProps) {
  const options = useMemo(() => {
    const mapped = sites.map((s) => ({ id: s.siteId, name: s.siteName }));
    return allowAllSites ? [{ id: "", name: "All sites" }, ...mapped] : mapped;
  }, [sites, allowAllSites]);

  return (
    <SiteFilterSelect
      sites={options}
      value={value ?? ""}
      onChange={(id) => onChange(id || null)}
      variant="field"
      searchable={false}
      className={className}
    />
  );
}
