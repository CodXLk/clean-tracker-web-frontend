"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  SupplierListSchema,
  SupplierSchema,
  type SupplierFormInput,
} from "@/features/inventory/schemas/inventory.schema";

export const supplierKeys = {
  all: ["suppliers"] as const,
  list: (activeOnly: boolean) => [...supplierKeys.all, "list", activeOnly] as const,
};

export function useSuppliers(activeOnly = false) {
  return useQuery({
    queryKey: supplierKeys.list(activeOnly),
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.suppliers.list, { params: { activeOnly } });
      return SupplierListSchema.parse(data);
    },
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SupplierFormInput) => {
      const { data } = await clientApi.post(ENDPOINTS.suppliers.create, input);
      return SupplierSchema.parse(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: supplierKeys.all }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<SupplierFormInput> & { active?: boolean } }) => {
      const { data } = await clientApi.put(ENDPOINTS.suppliers.byId(id), input);
      return SupplierSchema.parse(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: supplierKeys.all }),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.suppliers.byId(id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: supplierKeys.all }),
  });
}
