"use client";

import { MapPin } from "lucide-react";
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
  if (sites.length < 2) return null;

  return (
    <label
      className={`flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 shadow-sm ${className ?? ""}`}
    >
      <MapPin size={16} className="shrink-0 text-primary" />
      <span className="sr-only">Select site</span>
      <select
        value={selectedSiteId ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm font-medium text-on-surface focus:outline-none"
      >
        {sites.map((site) => (
          <option key={site.siteId} value={site.siteId}>
            {site.siteName}
            {site.siteId === checkedInSiteId ? " • Checked in" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
