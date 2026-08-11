"use client";

import { useQueries } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { UserListSchema } from "@/features/users/schemas/user.schema";
import type { Site } from "@/features/user-management/schemas/site.schema";
import { siteAssignmentKeys } from "./useSiteAssignments";

async function fetchSiteSupervisorIds(siteId: string): Promise<string[]> {
  const { data } = await clientApi.get(ENDPOINTS.sites.supervisors(siteId));
  return UserListSchema.parse(data).map((u) => u.id);
}

/**
 * Filters `sites` down to the ones `supervisorUserId` is assigned to. There is no
 * bulk "my sites" endpoint for supervisors (unlike cleaners' /attendance/my-sites),
 * so this fetches each site's supervisor roster in parallel — sharing the same
 * query key as `useSiteSupervisors` — and filters client-side.
 */
export function useSupervisorSiteFilter(sites: Site[], supervisorUserId: string | undefined) {
  const results = useQueries({
    queries: sites.map((site) => ({
      queryKey: siteAssignmentKeys.supervisors(site.id),
      queryFn: () => fetchSiteSupervisorIds(site.id),
      enabled: !!supervisorUserId,
      staleTime: 60_000,
    })),
  });

  const isLoading = sites.length > 0 && results.some((r) => r.isLoading);
  const sitesForSupervisor = sites.filter((_site, index) => {
    const ids = results[index]?.data;
    return !!supervisorUserId && !!ids && ids.includes(supervisorUserId);
  });

  return { sites: sitesForSupervisor, isLoading };
}
