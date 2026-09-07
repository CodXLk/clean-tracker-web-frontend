"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { ShiftListSchema, type Shift, type ShiftFormInput } from "@/features/user-management/schemas/shift.schema";

export const shiftKeys = {
  all: ["site-shifts"] as const,
  bySite: (siteId: string) => [...shiftKeys.all, siteId] as const,
};

export function useSiteShifts(siteId: string | undefined, enabled = true) {
  return useQuery<Shift[]>({
    queryKey: shiftKeys.bySite(siteId ?? ""),
    enabled: Boolean(siteId) && enabled,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.sites.shifts(siteId as string));
      return ShiftListSchema.parse(data);
    },
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ siteId, input }: { siteId: string; input: ShiftFormInput }) => {
      const body = { ...input, dayOfWeek: input.dayOfWeek ? input.dayOfWeek : null };
      await clientApi.post(ENDPOINTS.sites.shifts(siteId), body);
    },
    onSuccess: (_data, { siteId }) =>
      queryClient.invalidateQueries({ queryKey: shiftKeys.bySite(siteId) }),
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ shiftId, input }: { siteId: string; shiftId: string; input: Partial<ShiftFormInput> }) => {
      const body = { ...input, dayOfWeek: input.dayOfWeek ? input.dayOfWeek : null };
      await clientApi.put(ENDPOINTS.shifts.byId(shiftId), body);
    },
    onSuccess: (_data, { siteId }) =>
      queryClient.invalidateQueries({ queryKey: shiftKeys.bySite(siteId) }),
  });
}

export function useSetDefaultShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ shiftId }: { siteId: string; shiftId: string }) => {
      await clientApi.post(ENDPOINTS.shifts.default(shiftId));
    },
    onSuccess: (_data, { siteId }) =>
      queryClient.invalidateQueries({ queryKey: shiftKeys.bySite(siteId) }),
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ shiftId }: { siteId: string; shiftId: string }) => {
      await clientApi.delete(ENDPOINTS.shifts.byId(shiftId));
    },
    onSuccess: (_data, { siteId }) =>
      queryClient.invalidateQueries({ queryKey: shiftKeys.bySite(siteId) }),
  });
}

/** Set which in-house and outsource cleaner slots work a shift (replaces its membership). */
export function useSetShiftCleaners() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      shiftId,
      inHouseProfileIds,
      outsourceProfileIds,
    }: {
      siteId: string;
      shiftId: string;
      inHouseProfileIds: string[];
      outsourceProfileIds: string[];
    }) => {
      await clientApi.put(ENDPOINTS.shifts.cleaners(shiftId), {
        inHouseProfileIds,
        outsourceProfileIds,
      });
    },
    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.bySite(siteId) });
      queryClient.invalidateQueries({ queryKey: ["site-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["outsource-projects"] });
    },
  });
}
