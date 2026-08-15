"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  SupervisorScheduleListSchema,
  type SupervisorSchedule,
  type UpsertSupervisorSchedulePayload,
} from "@/features/user-management/schemas/supervisorSchedule.schema";

const scheduleKeys = {
  all: ["supervisor-schedules"] as const,
  site: (siteId: string) => ["supervisor-schedules", "site", siteId] as const,
  mine: ["supervisor-schedules", "mine"] as const,
};

export function useSupervisorSchedules(siteId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: scheduleKeys.site(siteId ?? ""),
    enabled: enabled && !!siteId,
    queryFn: async (): Promise<SupervisorSchedule[]> => {
      const { data } = await clientApi.get(ENDPOINTS.sites.supervisorSchedules(siteId as string));
      return SupervisorScheduleListSchema.parse(data);
    },
  });
}

export function useUpsertSupervisorSchedule(siteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpsertSupervisorSchedulePayload) => {
      const { data } = await clientApi.put(ENDPOINTS.sites.supervisorSchedules(siteId), payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: scheduleKeys.site(siteId) }),
  });
}

export function useDeleteSupervisorSchedule(siteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (scheduleId: string) => {
      await clientApi.delete(ENDPOINTS.sites.supervisorSchedule(siteId, scheduleId));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: scheduleKeys.site(siteId) }),
  });
}

/** The calling supervisor's own inspection schedules with upcoming dates. */
export function useMyInspectionSchedules(enabled = true) {
  return useQuery({
    queryKey: scheduleKeys.mine,
    enabled,
    queryFn: async (): Promise<SupervisorSchedule[]> => {
      const { data } = await clientApi.get(ENDPOINTS.inspectionSchedules.mine);
      return SupervisorScheduleListSchema.parse(data);
    },
  });
}
