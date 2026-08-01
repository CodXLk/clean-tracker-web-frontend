import { z } from "zod";

// ── Enums (mirror the Spring Boot enums) ────────────────────────────────────────

export const InventoryCategorySchema = z.enum([
  "LIQUID",
  "EQUIPMENT",
  "CONSUMABLE",
  "TOOL",
  "OTHER",
]);
export type InventoryCategory = z.infer<typeof InventoryCategorySchema>;

export const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  LIQUID: "Liquid",
  EQUIPMENT: "Equipment",
  CONSUMABLE: "Consumable",
  TOOL: "Tool",
  OTHER: "Other",
};

export const TransactionTypeSchema = z.enum([
  "MAIN_STOCK_ADD",
  "MAIN_STOCK_ADJUST",
  "DISPATCH_OUT",
  "DELIVERY_IN",
  "TASK_CONSUMPTION",
  "SITE_ADJUST",
]);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  MAIN_STOCK_ADD: "Stock added",
  MAIN_STOCK_ADJUST: "Stock corrected",
  DISPATCH_OUT: "Dispatched",
  DELIVERY_IN: "Received",
  TASK_CONSUMPTION: "Task used",
  SITE_ADJUST: "Site corrected",
};

export const RequestStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "FULFILLED",
  "CANCELLED",
]);
export type RequestStatus = z.infer<typeof RequestStatusSchema>;

export const DeliveryStatusSchema = z.enum(["DISPATCHED", "CONFIRMED", "CANCELLED"]);
export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;

// ── Items ───────────────────────────────────────────────────────────────────────

export const InventoryItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: InventoryCategorySchema,
  unit: z.string(),
  unitPrice: z.number(),
  mainStockQuantity: z.number(),
  stockValue: z.number(),
  active: z.boolean(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
export const InventoryItemListSchema = z.array(InventoryItemSchema);
export type InventoryItem = z.infer<typeof InventoryItemSchema>;

export const ItemFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(150, "Name is too long"),
  category: InventoryCategorySchema,
  unit: z.string().min(1, "Unit is required").max(20, "Unit is too long"),
  unitPrice: z.number().min(0, "Price cannot be negative"),
  openingStock: z.number().min(0, "Cannot be negative").optional(),
});
export type ItemFormInput = z.infer<typeof ItemFormSchema>;

/** Selectable measurement units for inventory items. */
export const UNIT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "pcs", label: "pcs (Pieces)" },
  { value: "Unit", label: "Unit" },
  { value: "Box", label: "Box" },
  { value: "Pack", label: "Pack" },
  { value: "Carton", label: "Carton" },
  { value: "Bottle", label: "Bottle" },
  { value: "Can", label: "Can" },
  { value: "Bag", label: "Bag" },
  { value: "Roll", label: "Roll" },
  { value: "Pair", label: "Pair" },
  { value: "Set", label: "Set" },
  { value: "Tube", label: "Tube" },
  { value: "Sachet", label: "Sachet" },
  { value: "L", label: "L (Litre)" },
  { value: "ml", label: "ml (Millilitre)" },
  { value: "gal", label: "gal (Gallon)" },
  { value: "kg", label: "kg (Kilogram)" },
  { value: "g", label: "g (Gram)" },
  { value: "m", label: "m (Metre)" },
];

// ── Site inventory ────────────────────────────────────────────────────────────

export const SiteInventorySchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  siteName: z.string(),
  itemId: z.string().uuid(),
  itemName: z.string(),
  category: InventoryCategorySchema,
  unit: z.string(),
  quantity: z.number(),
  minStock: z.number().nullable().optional(),
  lowStock: z.boolean(),
  updatedAt: z.string().nullable().optional(),
});
export const SiteInventoryListSchema = z.array(SiteInventorySchema);
export type SiteInventory = z.infer<typeof SiteInventorySchema>;

// ── Transactions (ledger) ───────────────────────────────────────────────────────

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  itemName: z.string(),
  siteId: z.string().uuid().nullable().optional(),
  siteName: z.string(),
  type: TransactionTypeSchema,
  quantityDelta: z.number(),
  balanceAfter: z.number(),
  refType: z.string().nullable().optional(),
  refId: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  performedBy: z.string().uuid().nullable().optional(),
  performedByName: z.string().nullable().optional(),
  performedAt: z.string(),
});
export const TransactionListSchema = z.array(TransactionSchema);
export type Transaction = z.infer<typeof TransactionSchema>;

// ── Requests ────────────────────────────────────────────────────────────────────

const RequestLineSchema = z.object({
  itemId: z.string().uuid(),
  itemName: z.string(),
  unit: z.string(),
  requestedQuantity: z.number(),
});

export const InventoryRequestSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  siteName: z.string(),
  requestedBy: z.string().uuid(),
  requestedByName: z.string().nullable().optional(),
  status: RequestStatusSchema,
  note: z.string().nullable().optional(),
  reviewedBy: z.string().uuid().nullable().optional(),
  reviewedByName: z.string().nullable().optional(),
  reviewedAt: z.string().nullable().optional(),
  reviewNote: z.string().nullable().optional(),
  lines: z.array(RequestLineSchema),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
export const InventoryRequestListSchema = z.array(InventoryRequestSchema);
export type InventoryRequest = z.infer<typeof InventoryRequestSchema>;

// ── Deliveries ──────────────────────────────────────────────────────────────────

const DeliveryLineSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  itemName: z.string(),
  unit: z.string(),
  expectedQuantity: z.number(),
  confirmedQuantity: z.number().nullable().optional(),
  minStock: z.number().nullable().optional(),
});

export const InventoryDeliverySchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  siteName: z.string(),
  requestId: z.string().uuid().nullable().optional(),
  status: DeliveryStatusSchema,
  dispatchedBy: z.string().uuid(),
  dispatchedByName: z.string().nullable().optional(),
  dispatchedAt: z.string(),
  confirmedBy: z.string().uuid().nullable().optional(),
  confirmedByName: z.string().nullable().optional(),
  confirmedAt: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  lines: z.array(DeliveryLineSchema),
  createdAt: z.string().nullable().optional(),
});
export const InventoryDeliveryListSchema = z.array(InventoryDeliverySchema);
export type InventoryDelivery = z.infer<typeof InventoryDeliverySchema>;
export type InventoryDeliveryLine = z.infer<typeof DeliveryLineSchema>;
