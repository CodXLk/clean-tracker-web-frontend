"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { inventoryKeys } from "./useInventory";
import { purchaseOrderKeys } from "./usePurchaseOrders";
import {
  ProcurementCapabilitiesSchema, InventoryPersonListSchema, InventoryReviewSchema,
  GeneratedInventoryPurchaseSchema, PurchaseOrderSchema, InventoryDeliverySchema,
  type PurchaseOrderType, type ProcurementMethod,
} from "../schemas/inventory.schema";

export type ProcurementOrderInput = {
  orderType: PurchaseOrderType; procurementMethod?: ProcurementMethod;
  siteId?: string; cleanerId?: string; assignedReceiverId?: string; handCarryPersonId?: string;
  expectedDate?: string; deliveryAddress?: string; version?: number; operationKey?: string; legacyDraftId?: string; draft: true;
  lines: { id?: string; itemId: string; quantity: number; supplierId?: string; note?: string; unitCost?: number }[];
};

function useInvalidateWorkflow() {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: inventoryKeys.all });
    client.invalidateQueries({ queryKey: purchaseOrderKeys.all });
    client.invalidateQueries({ queryKey: ["goods-receipts"] });
  };
}

export function useProcurementCapabilities() {
  return useQuery({ queryKey: [...purchaseOrderKeys.all, "capabilities"], retry: false,
    queryFn: async () => ProcurementCapabilitiesSchema.parse((await clientApi.get(ENDPOINTS.purchaseOrders.capabilities)).data) });
}

export function useInventoryPeople(type: PurchaseOrderType, siteId?: string, cleanerId?: string, enabled = true) {
  return useQuery({ queryKey: [...inventoryKeys.all, "people", type, siteId, cleanerId],
    enabled: enabled && (type === "WAREHOUSE" || (type === "SITE" ? !!siteId : !!cleanerId)),
    queryFn: async () => InventoryPersonListSchema.parse((await clientApi.get(ENDPOINTS.purchaseOrders.eligiblePeople,
      { params: { orderType: type, siteId, cleanerId } })).data) });
}

export function useInventoryReview(id?: string) {
  return useQuery({ queryKey: [...inventoryKeys.all, "review", id], enabled: !!id,
    queryFn: async () => InventoryReviewSchema.parse((await clientApi.get(ENDPOINTS.inventory.requestAction(id!, "review"))).data) });
}

export function useSaveInventoryReview() {
  const invalidate = useInvalidateWorkflow();
  return useMutation({ mutationFn: async (input: { id: string; version: number; operationKey: string;
    lines: { id?: string; itemId: string; quantity: number }[] }) => {
    const { id, ...body } = input;
    return InventoryReviewSchema.parse((await clientApi.put(ENDPOINTS.inventory.requestAction(id, "review"), body)).data);
  }, onSuccess: invalidate });
}

export function useShortagePurchaseOrder() {
  const invalidate = useInvalidateWorkflow();
  return useMutation({ mutationFn: async (input: { id: string; version: number; operationKey: string }) => {
    const { id, ...body } = input;
    return GeneratedInventoryPurchaseSchema.parse((await clientApi.post(ENDPOINTS.inventory.requestAction(id, "shortage-purchase-order"), body)).data);
  }, onSuccess: invalidate });
}

export function useReleaseInventoryReview() {
  const invalidate = useInvalidateWorkflow();
  return useMutation({ mutationFn: async (input: { id: string; version: number; operationKey: string }) => {
    const { id, ...body } = input;
    return InventoryReviewSchema.parse((await clientApi.post(ENDPOINTS.inventory.requestAction(id, "review-release"), body)).data);
  }, onSuccess: invalidate });
}

export function useInventoryReviewDecision() {
  const invalidate = useInvalidateWorkflow();
  return useMutation({ mutationFn: async (input: { id: string; version: number; operationKey: string;
    assignedReceiverId?: string; note?: string; choices: { allocationId: string; approve: boolean }[]; rejectUnallocated: boolean }) => {
    const { id, ...body } = input;
    return InventoryReviewSchema.parse((await clientApi.post(ENDPOINTS.inventory.requestAction(id, "review-decision"), body)).data);
  }, onSuccess: invalidate });
}

export function useSaveProcurementOrder() {
  const invalidate = useInvalidateWorkflow();
  return useMutation({ mutationFn: async ({ id, input }: { id?: string; input: ProcurementOrderInput }) => {
    const response = id ? await clientApi.put(ENDPOINTS.purchaseOrders.byId(id), input)
      : await clientApi.post(ENDPOINTS.purchaseOrders.create, input);
    return PurchaseOrderSchema.parse(response.data);
  }, onSuccess: invalidate });
}

export function useProcurementAction() {
  const invalidate = useInvalidateWorkflow();
  return useMutation({ mutationFn: async (input: { id: string; action: "start-hand-carry" | "supplier-status" | "supplier-resend"; supplierId?: string; status?: string }) => {
    const path = input.action === "start-hand-carry" ? ENDPOINTS.purchaseOrders.startHandCarry(input.id)
      : input.action === "supplier-resend" ? ENDPOINTS.purchaseOrders.supplierResend(input.id, input.supplierId!)
      : ENDPOINTS.purchaseOrders.supplierStatus(input.id, input.supplierId!);
    return PurchaseOrderSchema.parse((await clientApi.post(path, {}, { params: input.status ? { status: input.status } : {} })).data);
  }, onSuccess: invalidate });
}

export function useWorkflowDeliveryAction() {
  const invalidate = useInvalidateWorkflow();
  return useMutation({ mutationFn: async (input: { id: string; action: "progress" | "confirm" | "reassign"; body: unknown }) =>
    InventoryDeliverySchema.parse((await clientApi.post(ENDPOINTS.inventory.deliveryAction(input.id, input.action), input.body)).data), onSuccess: invalidate });
}

export function useCreatePurchaseDelivery() {
  const invalidate = useInvalidateWorkflow();
  return useMutation({ mutationFn: async (input: { purchaseOrderId: string; supplierId?: string; operationKey: string;
    lines: { purchaseOrderLineId: string; quantity: number }[] }) => InventoryDeliverySchema.parse(
      (await clientApi.post(ENDPOINTS.inventory.deliveryById("from-purchase-order"), input)).data), onSuccess: invalidate });
}

export function useWorkflowPurchaseOrder(id?: string) {
  return useQuery({ queryKey: [...purchaseOrderKeys.all, "detail", id], enabled: !!id,
    queryFn: async () => PurchaseOrderSchema.parse((await clientApi.get(ENDPOINTS.purchaseOrders.byId(id!))).data) });
}