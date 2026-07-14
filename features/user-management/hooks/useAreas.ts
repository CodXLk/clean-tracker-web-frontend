"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  AreaListSchema,
  AreaSchema,
  type Area,
  type AreaFormInput,
} from "@/features/user-management/schemas/area.schema";
import { areaKeys } from "./keys";

async function fetchAreas(floorId?: string): Promise<Area[]> {
  const { data } = await clientApi.get(ENDPOINTS.areas.list, {
    params: floorId ? { floorId } : undefined,
  });
  return AreaListSchema.parse(data);
}

/**
 * List areas. Pass a floorId to load only that floor's areas (the default dependent-select
 * behavior). Pass `{ enabled: true }` without a floorId to load every area visible to the
 * caller (the backend role-scopes this — e.g. a supervisor only gets their assigned sites').
 */
export function useAreas(floorId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: areaKeys.list(floorId),
    queryFn: () => fetchAreas(floorId),
    enabled: options?.enabled ?? !!floorId,
  });
}

export function useCreateArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ floorId, input }: { floorId: string; input: AreaFormInput }) => {
      const { data } = await clientApi.post(ENDPOINTS.areas.create, {
        floorId,
        name: input.name.trim(),
      });
      return AreaSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: areaKeys.lists() }),
  });
}

export function useUpdateArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: AreaFormInput }) => {
      const { data } = await clientApi.put(ENDPOINTS.areas.byId(id), { name: input.name.trim() });
      return AreaSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: areaKeys.lists() }),
  });
}

export function useDeleteArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.areas.byId(id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: areaKeys.lists() }),
  });
}
