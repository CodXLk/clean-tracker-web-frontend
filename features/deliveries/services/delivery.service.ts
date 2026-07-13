import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  DeliveriesResponseSchema,
  DeliverySchema,
  InventoryResponseSchema,
  type DeliveriesResponse,
  type Delivery,
  type InventoryResponse,
  type ProcessDeliveryInput,
} from "@/features/deliveries/schemas/delivery.schema";

export async function fetchDeliveries(): Promise<DeliveriesResponse> {
  const { data } = await clientApi.get(ENDPOINTS.deliveries.list);
  return DeliveriesResponseSchema.parse(data);
}

export async function fetchInventory(): Promise<InventoryResponse> {
  const { data } = await clientApi.get(ENDPOINTS.inventory.list);
  return InventoryResponseSchema.parse(data);
}

export async function processDelivery(id: string, input: ProcessDeliveryInput): Promise<Delivery> {
  const { data } = await clientApi.post(ENDPOINTS.deliveries.process(id), input);
  return DeliverySchema.parse(data);
}
