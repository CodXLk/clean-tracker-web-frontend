"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

export const PurchaseOrderDraftSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable().optional(),
  supplierId: z.string().uuid().nullable().optional(),
  supplierName: z.string().nullable().optional(),
  payload: z.any(),
  createdByName: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedByName: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
export const PurchaseOrderDraftListSchema = z.array(PurchaseOrderDraftSchema);
export type PurchaseOrderDraft = z.infer<typeof PurchaseOrderDraftSchema>;

export type SavePurchaseOrderDraftInput = {
  title?: string;
  supplierId?: string;
  payload: unknown;
};

const draftKeys = {
  all: ["purchase-order-drafts"] as const,
};

export function usePurchaseOrderDrafts() {
  return useQuery({
    queryKey: draftKeys.all,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.purchaseOrderDrafts.list);
      return PurchaseOrderDraftListSchema.parse(data);
    },
  });
}

export function useSavePurchaseOrderDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: SavePurchaseOrderDraftInput }) => {
      if (id) {
        const { data } = await clientApi.put(ENDPOINTS.purchaseOrderDrafts.byId(id), input);
        return PurchaseOrderDraftSchema.parse(data);
      }
      const { data } = await clientApi.post(ENDPOINTS.purchaseOrderDrafts.create, input);
      return PurchaseOrderDraftSchema.parse(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: draftKeys.all }),
  });
}

export function useDeletePurchaseOrderDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.purchaseOrderDrafts.byId(id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: draftKeys.all }),
  });
}
