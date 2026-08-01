"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  InventoryItemListSchema,
  InventoryItemSchema,
  SiteInventoryListSchema,
  TransactionListSchema,
  InventoryRequestListSchema,
  InventoryRequestSchema,
  InventoryDeliveryListSchema,
  InventoryDeliverySchema,
  type ItemFormInput,
  type RequestStatus,
  type DeliveryStatus,
} from "@/features/inventory/schemas/inventory.schema";

export const inventoryKeys = {
  all: ["inventory"] as const,
  items: () => [...inventoryKeys.all, "items"] as const,
  siteInventory: (siteId: string | undefined) => [...inventoryKeys.all, "site", siteId ?? "none"] as const,
  lowStock: (siteId?: string) => [...inventoryKeys.all, "low-stock", siteId ?? "all"] as const,
  transactions: (filters: string) => [...inventoryKeys.all, "transactions", filters] as const,
  requests: (filters: string) => [...inventoryKeys.all, "requests", filters] as const,
  deliveries: (filters: string) => [...inventoryKeys.all, "deliveries", filters] as const,
};

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: inventoryKeys.all });
}

// ── Items ─────────────────────────────────────────────────────────────────────

export function useInventoryItems(activeOnly = false) {
  return useQuery({
    queryKey: [...inventoryKeys.items(), activeOnly],
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.inventory.items, { params: { activeOnly } });
      return InventoryItemListSchema.parse(data);
    },
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ItemFormInput) => {
      const { data } = await clientApi.post(ENDPOINTS.inventory.items, input);
      return InventoryItemSchema.parse(data);
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<ItemFormInput> & { active?: boolean } }) => {
      const { data } = await clientApi.put(ENDPOINTS.inventory.itemById(id), input);
      return InventoryItemSchema.parse(data);
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useAdjustMainStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantity, mode, note }: {
      id: string; quantity: number; mode: "ADD" | "SET"; note?: string;
    }) => {
      const { data } = await clientApi.post(ENDPOINTS.inventory.itemStock(id), { quantity, mode, note });
      return InventoryItemSchema.parse(data);
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.inventory.itemById(id));
    },
    onSuccess: () => invalidateAll(qc),
  });
}

// ── Site inventory ──────────────────────────────────────────────────────────────

export function useSiteInventory(siteId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.siteInventory(siteId),
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.inventory.siteInventory(siteId!));
      return SiteInventoryListSchema.parse(data);
    },
    enabled: !!siteId,
  });
}

export function useLowStock(siteId?: string) {
  return useQuery({
    queryKey: inventoryKeys.lowStock(siteId),
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.inventory.lowStock, {
        params: siteId ? { siteId } : undefined,
      });
      return SiteInventoryListSchema.parse(data);
    },
  });
}

export function useAdjustSiteStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ siteId, input }: {
      siteId: string;
      input: { itemId: string; quantity: number; minStock?: number; note?: string };
    }) => {
      const { data } = await clientApi.post(ENDPOINTS.inventory.siteAdjust(siteId), input);
      return data;
    },
    onSuccess: () => invalidateAll(qc),
  });
}

// ── Transactions ────────────────────────────────────────────────────────────────

export interface TransactionFilters {
  itemId?: string;
  siteId?: string;
  type?: string;
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: inventoryKeys.transactions(JSON.stringify(filters)),
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.inventory.transactions, { params: filters });
      return TransactionListSchema.parse(data);
    },
  });
}

// ── Requests ────────────────────────────────────────────────────────────────────

export interface RequestLineInput {
  itemId: string;
  requestedQuantity: number;
}

export function useRequests(filters: { status?: RequestStatus; siteId?: string } = {}) {
  return useQuery({
    queryKey: inventoryKeys.requests(JSON.stringify(filters)),
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.inventory.requests, { params: filters });
      return InventoryRequestListSchema.parse(data);
    },
  });
}

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { siteId: string; note?: string; lines: RequestLineInput[] }) => {
      const { data } = await clientApi.post(ENDPOINTS.inventory.requests, input);
      return InventoryRequestSchema.parse(data);
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useRequestAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action, note }: {
      id: string; action: "approve" | "reject" | "cancel"; note?: string;
    }) => {
      const { data } = await clientApi.post(ENDPOINTS.inventory.requestAction(id, action), { note });
      return data;
    },
    onSuccess: () => invalidateAll(qc),
  });
}

// ── Deliveries ──────────────────────────────────────────────────────────────────

export interface DispatchLineInput {
  itemId: string;
  expectedQuantity: number;
  minStock?: number;
}

export interface ConfirmLineInput {
  lineId: string;
  confirmedQuantity: number;
  minStock?: number;
}

export function useDeliveries(filters: { status?: DeliveryStatus; siteId?: string } = {}) {
  return useQuery({
    queryKey: inventoryKeys.deliveries(JSON.stringify(filters)),
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.inventory.deliveries, { params: filters });
      return InventoryDeliveryListSchema.parse(data);
    },
  });
}

export function useDispatchDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      siteId: string; requestId?: string; note?: string; lines: DispatchLineInput[];
    }) => {
      const { data } = await clientApi.post(ENDPOINTS.inventory.deliveries, input);
      return InventoryDeliverySchema.parse(data);
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useConfirmDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note, lines }: { id: string; note?: string; lines: ConfirmLineInput[] }) => {
      const { data } = await clientApi.post(ENDPOINTS.inventory.deliveryAction(id, "confirm"), { note, lines });
      return InventoryDeliverySchema.parse(data);
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useCancelDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await clientApi.post(ENDPOINTS.inventory.deliveryAction(id, "cancel"), {});
      return InventoryDeliverySchema.parse(data);
    },
    onSuccess: () => invalidateAll(qc),
  });
}
