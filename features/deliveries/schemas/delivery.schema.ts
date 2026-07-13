import { z } from "zod";

export const DeliveryLineItemSchema = z.object({
  name:          z.string(),
  requestedQty:  z.number(),
  deliveredQty:  z.number().optional(),
  unit:          z.string(),
});

export const DeliverySchema = z.object({
  id:          z.string(),
  label:       z.string(),
  site:        z.string(),
  requestedBy: z.string(),
  requestedAt: z.string(),
  status:      z.enum(["pending", "in_transit", "delivered"]),
  priority:    z.enum(["high", "medium", "low"]),
  items:       z.array(DeliveryLineItemSchema),
  notes:       z.string().optional(),
});

export const DeliveryKpisSchema = z.object({
  pending:       z.number(),
  inTransit:     z.number(),
  delivered:     z.number(),
  lowStockItems: z.number(),
});

export const DeliveriesResponseSchema = z.object({
  deliveries: z.array(DeliverySchema),
  kpis:       DeliveryKpisSchema,
});

export const InventoryItemSchema = z.object({
  id:       z.string(),
  name:     z.string(),
  level:    z.enum(["good", "medium", "low"]),
  stock:    z.number(),
  capacity: z.number(),
  unit:     z.string(),
  site:     z.string(),
});

export const InventoryResponseSchema = z.object({
  inventory: z.array(InventoryItemSchema),
});

export const ProcessDeliverySchema = z.object({
  items: z.array(
    z.object({
      name:         z.string(),
      deliveredQty: z.number().min(0),
    }),
  ),
  notes: z.string().optional(),
});

export type DeliveryLineItem     = z.infer<typeof DeliveryLineItemSchema>;
export type Delivery             = z.infer<typeof DeliverySchema>;
export type DeliveryKpis         = z.infer<typeof DeliveryKpisSchema>;
export type DeliveriesResponse   = z.infer<typeof DeliveriesResponseSchema>;
export type InventoryItem        = z.infer<typeof InventoryItemSchema>;
export type InventoryResponse    = z.infer<typeof InventoryResponseSchema>;
export type ProcessDeliveryInput = z.infer<typeof ProcessDeliverySchema>;
