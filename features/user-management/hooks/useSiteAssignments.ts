"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { UserListSchema, type User } from "@/features/users/schemas/user.schema";
import { CleanerListSchema, type Cleaner } from "@/features/cleaners/schemas/cleaner.schema";
import {
  SiteCleanerProfileSchema,
  type SiteCleanerProfile,
} from "@/features/user-management/schemas/site.schema";
import { z } from "zod";
import { siteKeys } from "./keys";

const SiteCleanerProfileListSchema = z.array(SiteCleanerProfileSchema);

export const siteAssignmentKeys = {
  all: ["site-assignments"] as const,
  supervisors: (siteId: string) => [...siteAssignmentKeys.all, "supervisors", siteId] as const,
  cleaners: (siteId: string) => [...siteAssignmentKeys.all, "cleaners", siteId] as const,
  cleanerProfiles: (siteId: string) => [...siteAssignmentKeys.all, "cleaner-profiles", siteId] as const,
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

// ── Cleaner profiles (per-site cleaner slots) ─────────────────────────────────────

async function fetchSiteCleanerProfiles(siteId: string): Promise<SiteCleanerProfile[]> {
  const { data } = await clientApi.get(ENDPOINTS.sites.cleanerProfiles(siteId));
  return SiteCleanerProfileListSchema.parse(data);
}

export function useSiteCleanerProfiles(siteId: string | undefined) {
  return useQuery({
    queryKey: siteAssignmentKeys.cleanerProfiles(siteId ?? ""),
    queryFn: () => fetchSiteCleanerProfiles(siteId!),
    enabled: !!siteId,
  });
}

export interface ProfileAssignmentInput {
  profileId: string;
  cleanerId: string | null;
}

export function useAssignCleanerProfiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ siteId, profiles }: { siteId: string; profiles: ProfileAssignmentInput[] }) => {
      const { data } = await clientApi.put(ENDPOINTS.sites.cleanerProfiles(siteId), { profiles });
      return SiteCleanerProfileListSchema.parse(data);
    },
    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: siteAssignmentKeys.cleanerProfiles(siteId) });
      queryClient.invalidateQueries({ queryKey: siteAssignmentKeys.cleaners(siteId) });
      queryClient.invalidateQueries({ queryKey: siteKeys.all });
    },
  });
}
