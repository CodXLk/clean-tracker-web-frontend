"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { inventoryKeys } from "@/features/inventory/hooks/useInventory";
import { purchaseOrderKeys } from "@/features/inventory/hooks/usePurchaseOrders";
import {
  GoodsReceiptListSchema,
  GoodsReceiptSchema,
} from "@/features/inventory/schemas/inventory.schema";

export const goodsReceiptKeys = {
  all: ["goods-receipts"] as const,
  list: (purchaseOrderId: string) => [...goodsReceiptKeys.all, "list", purchaseOrderId] as const,
};

export type CreateGoodsReceiptLineInput = {
  poLineId: string;
  quantity: number;
  batchNumber?: string;
  manufactureDate?: string;
  expireDate?: string;
  unitCost?: number;
};

export type CreateGoodsReceiptInput = {
  purchaseOrderId: string;
  note?: string;
  lines: CreateGoodsReceiptLineInput[];
};

export function useGoodsReceipts(purchaseOrderId?: string) {
  return useQuery({
    queryKey: goodsReceiptKeys.list(purchaseOrderId ?? "all"),
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.goodsReceipts.list, {
        params: purchaseOrderId ? { purchaseOrderId } : {},
      });
      return GoodsReceiptListSchema.parse(data);
    },
  });
}

export function useCreateGoodsReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGoodsReceiptInput) => {
      const { data } = await clientApi.post(ENDPOINTS.goodsReceipts.create, input);
      return GoodsReceiptSchema.parse(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goodsReceiptKeys.all });
      qc.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}
