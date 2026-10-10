"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  LeaveRequestListSchema,
  MyLeaveCoverListSchema,
  type CreateLeaveInput,
} from "@/features/leave/schemas/leave.schema";

const keys = {
  all: ["leave"] as const,
  mine: () => [...keys.all, "mine"] as const,
  list: (status?: string) => [...keys.all, "list", status ?? "all"] as const,
  myCovers: () => [...keys.all, "my-covers"] as const,
};

export function useMyLeave(enabled = true) {
  return useQuery({
    queryKey: keys.mine(),
    enabled,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.leave.mine);
      return LeaveRequestListSchema.parse(data);
    },
  });
}

export function useLeaveRequests(status?: string, enabled = true) {
  return useQuery({
    queryKey: keys.list(status),
    enabled,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.leave.list, {
        params: status ? { status } : undefined,
      });
      return LeaveRequestListSchema.parse(data);
    },
  });
}

export function useMyCovers(enabled = true) {
  return useQuery({
    queryKey: keys.myCovers(),
    enabled,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.leave.myCovers);
      return MyLeaveCoverListSchema.parse(data);
    },
    refetchInterval: 60_000,
  });
}

export function useCreateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLeaveInput) => {
      await clientApi.post(ENDPOINTS.leave.create, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.mine() }),
  });
}

export function useCancelLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.post(ENDPOINTS.leave.cancel(id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.mine() }),
  });
}

export function useAddLeaveCover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      leaveId: string;
      siteId: string;
      coveringUserId: string;
      coveringCleanerId?: string;
    }) => {
      await clientApi.post(ENDPOINTS.leave.addCover(input.leaveId), {
        siteId: input.siteId,
        coveringUserId: input.coveringUserId,
        coveringCleanerId: input.coveringCleanerId ?? null,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useRemoveLeaveCover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (coverId: string) => {
      await clientApi.delete(ENDPOINTS.leave.removeCover(coverId));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.post(ENDPOINTS.leave.approve(id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useRejectLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.post(ENDPOINTS.leave.reject(id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useAcceptCover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (coverId: string) => {
      await clientApi.post(ENDPOINTS.leave.acceptCover(coverId));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.myCovers() });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
