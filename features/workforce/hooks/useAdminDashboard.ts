"use client";

import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { AdminDashboardSchema, type AdminDashboard } from "@/features/workforce/schemas/dashboard.schema";

/** Management operational overview (super/company admin). */
export function useAdminDashboard(enabled = true) {
  return useQuery<AdminDashboard>({
    queryKey: ["dashboard", "overview"],
    enabled,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.dashboard.overview);
      return AdminDashboardSchema.parse(data);
    },
  });
}
