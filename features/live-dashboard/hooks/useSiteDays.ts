"use client";

import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { SiteDayListSchema, type SiteDay } from "@/features/live-dashboard/schemas/siteDay.schema";

interface SiteDaysParams {
  from: string;
  to: string;
  siteId?: string;
  /** Poll interval for live views (ms). */
  refetchInterval?: number;
  enabled?: boolean;
}

/** Per-site, per-day cleaning → inspection workflow status (management). */
export function useSiteDays({ from, to, siteId, refetchInterval, enabled = true }: SiteDaysParams) {
  return useQuery<SiteDay[]>({
    queryKey: ["dashboard", "site-days", from, to, siteId ?? null],
    enabled,
    staleTime: 30 * 1000,
    refetchInterval,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.dashboard.siteDays, {
        params: { from, to, ...(siteId ? { siteId } : {}) },
      });
      return SiteDayListSchema.parse(data);
    },
  });
}

/** siteId -> date -> site day, for schedule grids. */
export function indexSiteDays(days: SiteDay[] | undefined): Map<string, Map<string, SiteDay>> {
  const map = new Map<string, Map<string, SiteDay>>();
  for (const d of days ?? []) {
    const inner = map.get(d.siteId) ?? new Map<string, SiteDay>();
    inner.set(d.date, d);
    map.set(d.siteId, inner);
  }
  return map;
}
