"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  FloorListSchema,
  FloorSchema,
  type Floor,
  type FloorFormInput,
} from "@/features/user-management/schemas/floor.schema";
import { areaKeys, floorKeys } from "./keys";

async function fetchFloors(siteId?: string): Promise<Floor[]> {
  const { data } = await clientApi.get(ENDPOINTS.floors.list, {
    params: siteId ? { siteId } : undefined,
  });
  return FloorListSchema.parse(data);
}

/** List floors. Pass a siteId to load only that site's floors. */
export function useFloors(siteId?: string) {
  return useQuery({
    queryKey: floorKeys.list(siteId),
    queryFn: () => fetchFloors(siteId),
    enabled: !!siteId,
  });
}

export function useCreateFloor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ siteId, input }: { siteId: string; input: FloorFormInput }) => {
      const { data } = await clientApi.post(ENDPOINTS.floors.create, {
        siteId,
        name: input.name.trim(),
      });
      return FloorSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: floorKeys.lists() }),
  });
}

export function useUpdateFloor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: FloorFormInput }) => {
      const { data } = await clientApi.put(ENDPOINTS.floors.byId(id), { name: input.name.trim() });
      return FloorSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: floorKeys.lists() }),
  });
}

export function useDeleteFloor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.floors.byId(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: floorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: areaKeys.all });
    },
  });
}
