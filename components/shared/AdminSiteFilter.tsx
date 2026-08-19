"use client";

import { MapPin } from "lucide-react";
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
 * Site filter for management views: includes an "All sites" option and is always shown
 * (unlike the cleaner {@code SiteSelector}, which picks a single assigned site).
 */
export function AdminSiteFilter({ sites, value, onChange, className, allowAllSites = true }: AdminSiteFilterProps) {
  return (
    <label className={`flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 shadow-sm ${className ?? ""}`}>
      <MapPin size={16} className="shrink-0 text-primary" />
      <span className="sr-only">Filter by site</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full bg-transparent text-sm font-medium text-on-surface focus:outline-none"
      >
        {allowAllSites && <option value="">All sites</option>}
        {sites.map((site) => (
          <option key={site.siteId} value={site.siteId}>
            {site.siteName}
          </option>
        ))}
      </select>
    </label>
  );
}
