"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { UserListSchema, type User } from "@/features/users/schemas/user.schema";
import { CleanerListSchema, type Cleaner } from "@/features/cleaners/schemas/cleaner.schema";
import {
  SiteCleanerProfileSchema,
  SiteSupervisorProfileSchema,
  type SiteCleanerProfile,
  type SiteSupervisorProfile,
} from "@/features/user-management/schemas/site.schema";
import { z } from "zod";
import { siteKeys } from "./keys";

const SiteCleanerProfileListSchema = z.array(SiteCleanerProfileSchema);
const SiteSupervisorProfileListSchema = z.array(SiteSupervisorProfileSchema);

export const siteAssignmentKeys = {
  all: ["site-assignments"] as const,
  supervisors: (siteId: string) => [...siteAssignmentKeys.all, "supervisors", siteId] as const,
  cleaners: (siteId: string) => [...siteAssignmentKeys.all, "cleaners", siteId] as const,
  cleanerProfiles: (siteId: string) => [...siteAssignmentKeys.all, "cleaner-profiles", siteId] as const,
  supervisorProfiles: (siteId: string) => [...siteAssignmentKeys.all, "supervisor-profiles", siteId] as const,
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

/** Active supervisors who satisfy the site's required certificates. */
export function useEligibleSiteSupervisors(siteId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["site-eligible", "supervisors", siteId ?? ""],
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.sites.eligibleSupervisors(siteId!));
      return UserListSchema.parse(data);
    },
    enabled: !!siteId && enabled,
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

/** Cleaners who satisfy the site's required certificates. */
export function useEligibleSiteCleaners(siteId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["site-eligible", "cleaners", siteId ?? ""],
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.sites.eligibleCleaners(siteId!));
      return CleanerListSchema.parse(data);
    },
    enabled: !!siteId && enabled,
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

/** Replaces the General-task shifts assigned to one cleaner slot. */
export function useAssignProfileShifts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      siteId,
      profileId,
      shiftIds,
    }: {
      siteId: string;
      profileId: string;
      shiftIds: string[];
    }) => {
      const { data } = await clientApi.put(
        ENDPOINTS.sites.cleanerProfileShifts(siteId, profileId),
        { shiftIds },
      );
      return SiteCleanerProfileSchema.parse(data);
    },
    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: siteAssignmentKeys.cleanerProfiles(siteId) });
      queryClient.invalidateQueries({ queryKey: siteKeys.all });
    },
  });
}

/** Adds one cleaner slot, optionally copying an existing slot's task scope onto the new one. */
export function useAddCleanerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      siteId,
      copyFromProfileId,
    }: {
      siteId: string;
      copyFromProfileId?: string | null;
    }) => {
      const { data } = await clientApi.post(ENDPOINTS.sites.addCleanerProfile(siteId), {
        copyFromProfileId: copyFromProfileId ?? null,
      });
      return SiteCleanerProfileListSchema.parse(data);
    },
    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: siteAssignmentKeys.cleanerProfiles(siteId) });
      queryClient.invalidateQueries({ queryKey: siteAssignmentKeys.cleaners(siteId) });
      queryClient.invalidateQueries({ queryKey: siteKeys.all });
    },
  });
}

/** Removes a cleaner slot that has no tasks assigned. */
export function useRemoveCleanerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ siteId, profileId }: { siteId: string; profileId: string }) => {
      const { data } = await clientApi.delete(
        ENDPOINTS.sites.removeCleanerProfile(siteId, profileId),
      );
      return SiteCleanerProfileListSchema.parse(data);
    },
    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: siteAssignmentKeys.cleanerProfiles(siteId) });
      queryClient.invalidateQueries({ queryKey: siteAssignmentKeys.cleaners(siteId) });
      queryClient.invalidateQueries({ queryKey: siteKeys.all });
    },
  });
}

// ── Supervisor profiles (per-site supervisor slots) ───────────────────────────────

async function fetchSiteSupervisorProfiles(siteId: string): Promise<SiteSupervisorProfile[]> {
  const { data } = await clientApi.get(ENDPOINTS.sites.supervisorProfiles(siteId));
  return SiteSupervisorProfileListSchema.parse(data);
}

export function useSiteSupervisorProfiles(siteId: string | undefined) {
  return useQuery({
    queryKey: siteAssignmentKeys.supervisorProfiles(siteId ?? ""),
    queryFn: () => fetchSiteSupervisorProfiles(siteId!),
    enabled: !!siteId,
  });
}

export interface SupervisorProfileAssignmentInput {
  profileId: string;
  supervisorId: string | null;
}

export function useAssignSupervisorProfiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      siteId,
      profiles,
    }: {
      siteId: string;
      profiles: SupervisorProfileAssignmentInput[];
    }) => {
      const { data } = await clientApi.put(ENDPOINTS.sites.supervisorProfiles(siteId), { profiles });
      return SiteSupervisorProfileListSchema.parse(data);
    },
    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: siteAssignmentKeys.supervisorProfiles(siteId) });
      queryClient.invalidateQueries({ queryKey: siteAssignmentKeys.supervisors(siteId) });
      queryClient.invalidateQueries({ queryKey: siteKeys.all });
    },
  });
}

/** Adds one supervisor slot to a site. */
export function useAddSupervisorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ siteId }: { siteId: string }) => {
      const { data } = await clientApi.post(ENDPOINTS.sites.addSupervisorProfile(siteId), {});
      return SiteSupervisorProfileListSchema.parse(data);
    },
    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: siteAssignmentKeys.supervisorProfiles(siteId) });
      queryClient.invalidateQueries({ queryKey: siteKeys.all });
    },
  });
}

/** Removes a supervisor slot (a site keeps at least one). */
export function useRemoveSupervisorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ siteId, profileId }: { siteId: string; profileId: string }) => {
      const { data } = await clientApi.delete(
        ENDPOINTS.sites.removeSupervisorProfile(siteId, profileId),
      );
      return SiteSupervisorProfileListSchema.parse(data);
    },
    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: siteAssignmentKeys.supervisorProfiles(siteId) });
      queryClient.invalidateQueries({ queryKey: siteAssignmentKeys.supervisors(siteId) });
      queryClient.invalidateQueries({ queryKey: siteKeys.all });
    },
  });
}
