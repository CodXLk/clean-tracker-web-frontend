"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { UserListSchema, type User } from "@/features/users/schemas/user.schema";
import { CleanerListSchema, type Cleaner } from "@/features/cleaners/schemas/cleaner.schema";

export const siteAssignmentKeys = {
  all: ["site-assignments"] as const,
  supervisors: (siteId: string) => [...siteAssignmentKeys.all, "supervisors", siteId] as const,
  cleaners: (siteId: string) => [...siteAssignmentKeys.all, "cleaners", siteId] as const,
};

// ── Supervisors ─────────────────────────────────────────────────────────────────

async function fetchSiteSupervisors(siteId: string): Promise<User[]> {
  const { data } = await clientApi.get(ENDPOINTS.sites.supervisors(siteId));
  return UserListSchema.parse(data);
}

export function useSiteSupervisors(siteId: string | undefined) {
  return useQuery({
    queryKey: siteAssignmentKeys.supervisors(siteId ?? ""),
    queryFn: () => fetchSiteSupervisors(siteId!),
    enabled: !!siteId,
  });
}

export function useAssignSupervisors() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ siteId, userIds }: { siteId: string; userIds: string[] }) => {
      const { data } = await clientApi.put(ENDPOINTS.sites.supervisors(siteId), { userIds });
      return UserListSchema.parse(data);
    },
    onSuccess: (_data, { siteId }) =>
      queryClient.invalidateQueries({ queryKey: siteAssignmentKeys.supervisors(siteId) }),
  });
}

// ── Cleaners ────────────────────────────────────────────────────────────────────

async function fetchSiteCleaners(siteId: string): Promise<Cleaner[]> {
  const { data } = await clientApi.get(ENDPOINTS.sites.cleaners(siteId));
  return CleanerListSchema.parse(data);
}

export function useSiteCleaners(siteId: string | undefined) {
  return useQuery({
    queryKey: siteAssignmentKeys.cleaners(siteId ?? ""),
    queryFn: () => fetchSiteCleaners(siteId!),
    enabled: !!siteId,
  });
}

export function useAssignCleaners() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ siteId, cleanerIds }: { siteId: string; cleanerIds: string[] }) => {
      const { data } = await clientApi.put(ENDPOINTS.sites.cleaners(siteId), { cleanerIds });
      return CleanerListSchema.parse(data);
    },
    onSuccess: (_data, { siteId }) =>
      queryClient.invalidateQueries({ queryKey: siteAssignmentKeys.cleaners(siteId) }),
  });
}
