"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  OutsourceProjectListSchema,
  OutsourceProjectSchema,
  OutsourceCleanerProfileSchema,
  OutsourceSupervisorProfileSchema,
  type CreateOutsourceProjectInput,
  type OutsourceProject,
  type OutsourceCleanerProfile,
  type OutsourceSupervisorProfile,
} from "@/features/outsource/schemas/outsourceProject.schema";
import { CleanerListSchema, type Cleaner } from "@/features/cleaners/schemas/cleaner.schema";
import { UserListSchema, type User } from "@/features/users/schemas/user.schema";

const outsourceKeys = {
  all: ["outsource-projects"] as const,
  list: () => [...outsourceKeys.all, "list"] as const,
  cleanerProfiles: (projectId: string) => [...outsourceKeys.all, "cleaner-profiles", projectId] as const,
  supervisorProfiles: (projectId: string) => [...outsourceKeys.all, "supervisor-profiles", projectId] as const,
};

const OutsourceCleanerProfileListSchema = z.array(OutsourceCleanerProfileSchema);
const OutsourceSupervisorProfileListSchema = z.array(OutsourceSupervisorProfileSchema);

async function fetchProjects(): Promise<OutsourceProject[]> {
  const { data } = await clientApi.get(ENDPOINTS.outsourceProjects.list);
  return OutsourceProjectListSchema.parse(data);
}

export function useOutsourceProjects() {
  return useQuery({
    queryKey: outsourceKeys.list(),
    queryFn: fetchProjects,
  });
}

/** The single outsource project linked to a site (or null when none), from the cached list. */
export function useSiteOutsourceProject(siteId: string | undefined) {
  const query = useOutsourceProjects();
  const project = siteId
    ? (query.data ?? []).find((p) => p.siteId === siteId) ?? null
    : null;
  return { ...query, project };
}

export function useCreateOutsourceProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOutsourceProjectInput) => {
      const { data } = await clientApi.post(ENDPOINTS.outsourceProjects.create, input);
      return OutsourceProjectSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: outsourceKeys.all }),
  });
}

export function useDeleteOutsourceProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.outsourceProjects.byId(id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: outsourceKeys.all }),
  });
}

// ── Eligible outsource staff ─────────────────────────────────────────────────────

export function useEligibleOutsourceCleaners(enabled = true) {
  return useQuery<Cleaner[]>({
    queryKey: ["outsource-eligible", "cleaners"],
    enabled,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.outsourceProjects.eligibleCleaners);
      return CleanerListSchema.parse(data);
    },
  });
}

export function useEligibleOutsourceSupervisors(enabled = true) {
  return useQuery<User[]>({
    queryKey: ["outsource-eligible", "supervisors"],
    enabled,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.outsourceProjects.eligibleSupervisors);
      return UserListSchema.parse(data);
    },
  });
}

// ── Outsource cleaner slots ────────────────────────────────────────────────────

export interface OutsourceProfileAssignmentInput {
  profileId: string;
  cleanerId?: string | null;
  supervisorId?: string | null;
}

export function useOutsourceCleanerProfiles(projectId: string | undefined) {
  return useQuery<OutsourceCleanerProfile[]>({
    queryKey: outsourceKeys.cleanerProfiles(projectId ?? ""),
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.outsourceProjects.cleanerProfiles(projectId!));
      return OutsourceCleanerProfileListSchema.parse(data);
    },
  });
}

export function useAssignOutsourceCleaners() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, profiles }: {
      projectId: string;
      profiles: { profileId: string; cleanerId: string | null }[];
    }) => {
      const { data } = await clientApi.put(ENDPOINTS.outsourceProjects.cleanerProfiles(projectId), { profiles });
      return OutsourceCleanerProfileListSchema.parse(data);
    },
    onSuccess: (_d, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: outsourceKeys.cleanerProfiles(projectId) });
      queryClient.invalidateQueries({ queryKey: outsourceKeys.all });
    },
  });
}

export function useAddOutsourceCleanerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId }: { projectId: string }) => {
      const { data } = await clientApi.post(ENDPOINTS.outsourceProjects.addCleanerProfile(projectId));
      return OutsourceCleanerProfileListSchema.parse(data);
    },
    onSuccess: (_d, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: outsourceKeys.cleanerProfiles(projectId) });
      queryClient.invalidateQueries({ queryKey: outsourceKeys.all });
    },
  });
}

export function useRemoveOutsourceCleanerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, profileId }: { projectId: string; profileId: string }) => {
      const { data } = await clientApi.delete(
        ENDPOINTS.outsourceProjects.removeCleanerProfile(projectId, profileId),
      );
      return OutsourceCleanerProfileListSchema.parse(data);
    },
    onSuccess: (_d, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: outsourceKeys.cleanerProfiles(projectId) });
      queryClient.invalidateQueries({ queryKey: outsourceKeys.all });
    },
  });
}

// ── Outsource supervisor slots ───────────────────────────────────────────────────

export function useOutsourceSupervisorProfiles(projectId: string | undefined) {
  return useQuery<OutsourceSupervisorProfile[]>({
    queryKey: outsourceKeys.supervisorProfiles(projectId ?? ""),
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.outsourceProjects.supervisorProfiles(projectId!));
      return OutsourceSupervisorProfileListSchema.parse(data);
    },
  });
}

export function useAssignOutsourceSupervisors() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, profiles }: {
      projectId: string;
      profiles: { profileId: string; supervisorId: string | null }[];
    }) => {
      const { data } = await clientApi.put(ENDPOINTS.outsourceProjects.supervisorProfiles(projectId), { profiles });
      return OutsourceSupervisorProfileListSchema.parse(data);
    },
    onSuccess: (_d, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: outsourceKeys.supervisorProfiles(projectId) });
      queryClient.invalidateQueries({ queryKey: outsourceKeys.all });
    },
  });
}

export function useAddOutsourceSupervisorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId }: { projectId: string }) => {
      const { data } = await clientApi.post(ENDPOINTS.outsourceProjects.addSupervisorProfile(projectId));
      return OutsourceSupervisorProfileListSchema.parse(data);
    },
    onSuccess: (_d, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: outsourceKeys.supervisorProfiles(projectId) });
      queryClient.invalidateQueries({ queryKey: outsourceKeys.all });
    },
  });
}

export function useRemoveOutsourceSupervisorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, profileId }: { projectId: string; profileId: string }) => {
      const { data } = await clientApi.delete(
        ENDPOINTS.outsourceProjects.removeSupervisorProfile(projectId, profileId),
      );
      return OutsourceSupervisorProfileListSchema.parse(data);
    },
    onSuccess: (_d, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: outsourceKeys.supervisorProfiles(projectId) });
      queryClient.invalidateQueries({ queryKey: outsourceKeys.all });
    },
  });
}
