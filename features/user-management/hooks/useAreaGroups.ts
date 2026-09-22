"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  AreaGroupListSchema,
  AreaGroupSchema,
  type AreaGroup,
} from "@/features/user-management/schemas/area.schema";
import { areaGroupKeys, areaKeys } from "./keys";

async function fetchAreaGroups(floorId?: string): Promise<AreaGroup[]> {
  const { data } = await clientApi.get(ENDPOINTS.areaGroups.list, {
    params: floorId ? { floorId } : undefined,
  });
  return AreaGroupListSchema.parse(data);
}

/** List area groups, optionally scoped to one floor. */
export function useAreaGroups(floorId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: areaGroupKeys.list(floorId),
    queryFn: () => fetchAreaGroups(floorId),
    enabled: options?.enabled ?? !!floorId,
  });
}

interface AreaGroupPayload {
  name: string;
  areaIds: string[];
}

export function useCreateAreaGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ floorId, input }: { floorId: string; input: AreaGroupPayload }) => {
      const { data } = await clientApi.post(ENDPOINTS.areaGroups.create, {
        floorId,
        name: input.name.trim(),
        areaIds: input.areaIds,
      });
      return AreaGroupSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaGroupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
    },
  });
}

export function useUpdateAreaGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<AreaGroupPayload> }) => {
      const { data } = await clientApi.put(ENDPOINTS.areaGroups.byId(id), {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.areaIds !== undefined ? { areaIds: input.areaIds } : {}),
      });
      return AreaGroupSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaGroupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
    },
  });
}

export function useDeleteAreaGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.areaGroups.byId(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaGroupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
    },
  });
}

/** Persist a new area-group display order within a floor (super admin / company admin). */
export function useReorderAreaGroups() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ floorId, groupIds }: { floorId: string; groupIds: string[] }) => {
      const { data } = await clientApi.put(ENDPOINTS.areaGroups.reorder, { floorId, groupIds });
      return AreaGroupListSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaGroupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
    },
  });
}
