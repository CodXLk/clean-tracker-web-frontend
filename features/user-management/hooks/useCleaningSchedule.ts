"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { SiteCleaningTemplateSchema } from "@/features/user-management/schemas/site.schema";
import { assignmentKeys } from "@/features/workforce/hooks/assignmentKeys";

const CleaningTemplateListSchema = z.array(SiteCleaningTemplateSchema);

async function fetchCleaningTemplates(siteId: string) {
  const { data } = await clientApi.get(ENDPOINTS.sites.cleaningTemplates(siteId));
  return CleaningTemplateListSchema.parse(data);
}

/** The saved templates available in a site's cleaning schedule. */
export function useSiteCleaningTemplates(siteId: string | undefined) {
  return useQuery({
    queryKey: ["site-cleaning-templates", siteId],
    queryFn: () => fetchCleaningTemplates(siteId!),
    enabled: !!siteId,
  });
}

export interface CleaningCheckInInput {
  siteId: string;
  date: string; // yyyy-MM-dd
  siteCleaningTemplateId: string;
  floorId?: string;
  areaId?: string;
}

/** Check a template in for a day: generates a one-time assignment and notifies cleaners. */
export function useCleaningCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ siteId, ...body }: CleaningCheckInInput) => {
      const { data } = await clientApi.post(ENDPOINTS.sites.cleaningCheckIn(siteId), body);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assignmentKeys.all }),
  });
}
