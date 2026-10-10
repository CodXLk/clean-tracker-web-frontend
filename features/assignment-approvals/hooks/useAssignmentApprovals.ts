"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  ManagementAssignmentAlertListSchema,
  PendingAssignmentListSchema,
} from "@/features/assignment-approvals/schemas/assignmentApproval.schema";

const keys = {
  all: ["assignment-approvals"] as const,
  mine: () => [...keys.all, "mine"] as const,
  alerts: () => [...keys.all, "alerts"] as const,
};

/** Slots the current user has been assigned to but hasn't accepted yet. */
export function useMyPendingAssignments(enabled = true) {
  return useQuery({
    queryKey: keys.mine(),
    enabled,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.assignmentApprovals.mine);
      return PendingAssignmentListSchema.parse(data);
    },
    refetchInterval: 60_000,
  });
}

/** Accept a slot assignment. */
export function useApproveAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { type: string; profileId: string }) => {
      await clientApi.post(ENDPOINTS.assignmentApprovals.approve, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.mine() });
      qc.invalidateQueries({ queryKey: ["site-cleaner-profiles"] });
      qc.invalidateQueries({ queryKey: ["site-supervisor-profiles"] });
      qc.invalidateQueries({ queryKey: ["work-orders"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/** Management high-alerts: slots whose start passed while unaccepted or unmanned. */
export function useAssignmentAlerts(enabled = true) {
  return useQuery({
    queryKey: keys.alerts(),
    enabled,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.assignmentApprovals.alerts);
      return ManagementAssignmentAlertListSchema.parse(data);
    },
    refetchInterval: 60_000,
  });
}
