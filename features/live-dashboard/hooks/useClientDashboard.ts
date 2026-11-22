"use client";

import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  ClientOverviewSchema,
  ClientScheduleSchema,
  type ClientOverview,
  type ClientSchedule,
} from "@/features/live-dashboard/schemas/clientDashboard.schema";

/** Client portal: today's cleaning across the client's own sites. */
export function useClientOverview(enabled = true) {
  return useQuery<ClientOverview>({
    queryKey: ["dashboard", "client", "overview"],
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.dashboard.clientOverview);
      return ClientOverviewSchema.parse(data);
    },
  });
}

/** Client portal: the client's sites and their simplified status per day. */
export function useClientSchedule({ from, to, enabled = true }: { from: string; to: string; enabled?: boolean }) {
  return useQuery<ClientSchedule>({
    queryKey: ["dashboard", "client", "site-days", from, to],
    enabled,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.dashboard.clientSiteDays, { params: { from, to } });
      return ClientScheduleSchema.parse(data);
    },
  });
}