"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  WorkOrderListSchema,
  WorkOrderSchema,
  WorkOrderCleanerProfileListSchema,
  WorkOrderSupervisorProfileListSchema,
  type CreateWorkOrderInput,
  type UpdateWorkOrderInput,
  type WorkOrder,
  type WorkOrderCleanerProfile,
  type WorkOrderStatus,
  type WorkOrderSupervisorProfile,
} from "@/features/work-orders/schemas/workOrder.schema";
import { CleanerListSchema, type Cleaner } from "@/features/cleaners/schemas/cleaner.schema";
import { UserListSchema, type User } from "@/features/users/schemas/user.schema";

const workOrderKeys = {
  all: ["work-orders"] as const,
  list: () => [...workOrderKeys.all, "list"] as const,
  detail: (id: string) => [...workOrderKeys.all, "detail", id] as const,
  cleanerProfiles: (id: string) => [...workOrderKeys.all, "cleaner-profiles", id] as const,
  supervisorProfiles: (id: string) => [...workOrderKeys.all, "supervisor-profiles", id] as const,
};

async function fetchWorkOrders(): Promise<WorkOrder[]> {
  const { data } = await clientApi.get(ENDPOINTS.workOrders.list);
  return WorkOrderListSchema.parse(data);
}

export function useWorkOrders() {
  return useQuery({
    queryKey: workOrderKeys.list(),
    queryFn: fetchWorkOrders,
  });
}

/** All work orders linked to a site, from the cached list. */
export function useSiteWorkOrders(siteId: string | undefined) {
  const query = useWorkOrders();
  const workOrders = siteId ? (query.data ?? []).filter((w) => w.siteId === siteId) : [];
  return { ...query, workOrders };
}

export function useWorkOrder(id: string | undefined) {
  return useQuery({
    queryKey: workOrderKeys.detail(id ?? ""),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.workOrders.byId(id!));
      return WorkOrderSchema.parse(data);
    },
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateWorkOrderInput) => {
      const { data } = await clientApi.post(ENDPOINTS.workOrders.create, input);
      return WorkOrderSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workOrderKeys.all }),
  });
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateWorkOrderInput }) => {
      const { data } = await clientApi.put(ENDPOINTS.workOrders.byId(id), input);
      return WorkOrderSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workOrderKeys.all }),
  });
}

export function useUpdateWorkOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: WorkOrderStatus }) => {
      const { data } = await clientApi.patch(ENDPOINTS.workOrders.status(id), { status });
      return WorkOrderSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workOrderKeys.all }),
  });
}

export function useDeleteWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.workOrders.byId(id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workOrderKeys.all }),
  });
}

/** Upload one or more client-sent photos to a work order (multipart). */
export function useUploadWorkOrderPhotos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, files }: { id: string; files: File[] }) => {
      const formData = new FormData();
      for (const file of files) formData.append("photos", file);
      const { data } = await clientApi.post(ENDPOINTS.workOrders.photos(id), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return WorkOrderSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workOrderKeys.all }),
  });
}

export function useDeleteWorkOrderPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, photoId }: { id: string; photoId: string }) => {
      const { data } = await clientApi.delete(ENDPOINTS.workOrders.deletePhoto(id, photoId));
      return WorkOrderSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workOrderKeys.all }),
  });
}

// ── Eligible work-order staff (same pool as general cleaners / supervisors) ────────

export function useEligibleWorkOrderCleaners(enabled = true) {
  return useQuery<Cleaner[]>({
    queryKey: ["work-order-eligible", "cleaners"],
    enabled,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.workOrders.eligibleCleaners);
      return CleanerListSchema.parse(data);
    },
  });
}

export function useEligibleWorkOrderSupervisors(enabled = true) {
  return useQuery<User[]>({
    queryKey: ["work-order-eligible", "supervisors"],
    enabled,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.workOrders.eligibleSupervisors);
      return UserListSchema.parse(data);
    },
  });
}

// ── Work-order cleaner slots ─────────────────────────────────────────────────────

export function useWorkOrderCleanerProfiles(id: string | undefined) {
  return useQuery<WorkOrderCleanerProfile[]>({
    queryKey: workOrderKeys.cleanerProfiles(id ?? ""),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.workOrders.cleanerProfiles(id!));
      return WorkOrderCleanerProfileListSchema.parse(data);
    },
  });
}

export function useAssignWorkOrderCleaners() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, profiles }: {
      id: string;
      profiles: { profileId: string; cleanerId: string | null }[];
    }) => {
      const { data } = await clientApi.put(ENDPOINTS.workOrders.cleanerProfiles(id), { profiles });
      return WorkOrderCleanerProfileListSchema.parse(data);
    },
    onSuccess: (_d, { id }) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.cleanerProfiles(id) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all });
    },
  });
}

// ── Work-order supervisor slots ──────────────────────────────────────────────────

export function useWorkOrderSupervisorProfiles(id: string | undefined) {
  return useQuery<WorkOrderSupervisorProfile[]>({
    queryKey: workOrderKeys.supervisorProfiles(id ?? ""),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.workOrders.supervisorProfiles(id!));
      return WorkOrderSupervisorProfileListSchema.parse(data);
    },
  });
}

export function useAssignWorkOrderSupervisors() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, profiles }: {
      id: string;
      profiles: { profileId: string; supervisorId: string | null }[];
    }) => {
      const { data } = await clientApi.put(ENDPOINTS.workOrders.supervisorProfiles(id), { profiles });
      return WorkOrderSupervisorProfileListSchema.parse(data);
    },
    onSuccess: (_d, { id }) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.supervisorProfiles(id) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all });
    },
  });
}
