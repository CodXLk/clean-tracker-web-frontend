"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  PurchaseOrderListSchema,
  PurchaseOrderSchema,
  type PurchaseOrderStatus,
} from "@/features/inventory/schemas/inventory.schema";

export const purchaseOrderKeys = {
  all: ["purchase-orders"] as const,
  list: (status: string) => [...purchaseOrderKeys.all, "list", status] as const,
};

export type CreatePurchaseOrderLineInput = {
  itemId: string;
  quantity: number;
  unitCost?: number;
};

export type CreatePurchaseOrderInput = {
  supplierId: string;
  expectedDate?: string;
  note?: string;
  lines: CreatePurchaseOrderLineInput[];
};

export function usePurchaseOrders(status?: PurchaseOrderStatus) {
  return useQuery({
    queryKey: purchaseOrderKeys.list(status ?? "all"),
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.purchaseOrders.list, {
        params: status ? { status } : {},
      });
      return PurchaseOrderListSchema.parse(data);
    },
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePurchaseOrderInput) => {
      const { data } = await clientApi.post(ENDPOINTS.purchaseOrders.create, input);
      return PurchaseOrderSchema.parse(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: purchaseOrderKeys.all }),
  });
}

export function useCancelPurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await clientApi.post(ENDPOINTS.purchaseOrders.cancel(id), {});
      return PurchaseOrderSchema.parse(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: purchaseOrderKeys.all }),
  });
}
