"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  ShiftPlanListSchema,
  ShiftPlanSchema,
  SiteShiftContextSchema,
  type ShiftPlanInput,
} from "@/features/shifts/schemas/shiftPlan.schema";

export const shiftPlanKeys = {
  all: ["shift-plans"] as const,
  mine: () => [...shiftPlanKeys.all, "mine"] as const,
  pending: () => [...shiftPlanKeys.all, "pending"] as const,
  forCleaner: (cleanerId: string) => [...shiftPlanKeys.all, "cleaner", cleanerId] as const,
  context: (siteId: string) => [...shiftPlanKeys.all, "context", siteId] as const,
};

/** A cleaner's approved shifts (for management / supervisors). */
export function useCleanerShiftPlans(cleanerId: string | null | undefined) {
  return useQuery({
    queryKey: shiftPlanKeys.forCleaner(cleanerId ?? ""),
    enabled: !!cleanerId,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.shiftPlans.forCleaner(cleanerId!));
      return ShiftPlanListSchema.parse(data);
    },
  });
}

export function useSiteShiftContext(siteId: string | null | undefined) {
  return useQuery({
    queryKey: shiftPlanKeys.context(siteId ?? ""),
    enabled: !!siteId,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.shiftPlans.context(siteId!));
      return SiteShiftContextSchema.parse(data);
    },
  });
}

export function useMyShiftPlans(enabled = true) {
  return useQuery({
    queryKey: shiftPlanKeys.mine(),
    enabled,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.shiftPlans.mine);
      return ShiftPlanListSchema.parse(data);
    },
  });
}

export function usePendingShiftPlans(enabled = true) {
  return useQuery({
    queryKey: shiftPlanKeys.pending(),
    enabled,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.shiftPlans.pending);
      return ShiftPlanListSchema.parse(data);
    },
    refetchInterval: 60_000,
  });
}

export function useSubmitShiftPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { siteId: string; leaveCoverId?: string; plan: ShiftPlanInput }) => {
      const { data } = await clientApi.post(ENDPOINTS.shiftPlans.submit, input);
      return ShiftPlanSchema.parse(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: shiftPlanKeys.all }),
  });
}

export function useReviewShiftPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; decision: "approve" | "reject"; note?: string }) => {
      const url =
        input.decision === "approve" ? ENDPOINTS.shiftPlans.approve(input.id) : ENDPOINTS.shiftPlans.reject(input.id);
      await clientApi.post(url, { note: input.note });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shiftPlanKeys.all });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
