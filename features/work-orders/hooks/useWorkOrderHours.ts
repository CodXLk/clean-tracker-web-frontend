"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  WorkOrderHoursReviewSchema,
  type SaveHoursInput,
} from "@/features/work-orders/schemas/workOrderHours.schema";

const hoursKey = (id: string) => ["work-order-hours", id] as const;

export function useWorkOrderHours(workOrderId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: hoursKey(workOrderId ?? "none"),
    enabled: Boolean(workOrderId) && enabled,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.workOrders.hours(workOrderId as string));
      return WorkOrderHoursReviewSchema.parse(data);
    },
  });
}

export function useSaveSupervisorHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveHoursInput) => {
      const { data } = await clientApi.put(ENDPOINTS.workOrders.hoursSupervisor(input.workOrderId), {
        entries: input.entries,
      });
      return WorkOrderHoursReviewSchema.parse(data);
    },
    onSuccess: (_d, input) => qc.invalidateQueries({ queryKey: hoursKey(input.workOrderId) }),
  });
}

export function useApproveHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveHoursInput) => {
      const { data } = await clientApi.put(ENDPOINTS.workOrders.hoursAdmin(input.workOrderId), {
        entries: input.entries,
      });
      return WorkOrderHoursReviewSchema.parse(data);
    },
    onSuccess: (_d, input) => qc.invalidateQueries({ queryKey: hoursKey(input.workOrderId) }),
  });
}
