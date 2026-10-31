import { z } from "zod";

// ── Enums (mirror the Spring Boot enums) ────────────────────────────────────────

export const InventoryCategorySchema = z.enum([
  "LIQUID",
  "EQUIPMENT",
  "CONSUMABLE",
  "TOOL",
  "CHEMICAL",
  "OTHER",
]);
export type InventoryCategory = z.infer<typeof InventoryCategorySchema>;

export const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  LIQUID: "Liquid",
  EQUIPMENT: "Equipment",
  CONSUMABLE: "Consumable",
  TOOL: "Tool",
  CHEMICAL: "Chemical",
  OTHER: "Other",
};

export const TransactionTypeSchema = z.enum([
  "MAIN_STOCK_ADD",
  "MAIN_STOCK_ADJUST",
  "DISPATCH_OUT",
  "DELIVERY_IN",
  "TASK_CONSUMPTION",
  "SITE_ADJUST",
  "GRN_IN",
  "CLEANER_ISSUE",
  "CLEANER_IN", "CLEANER_ADJUST",
]);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  MAIN_STOCK_ADD: "Stock added",
  MAIN_STOCK_ADJUST: "Stock corrected",
  DISPATCH_OUT: "Dispatched",
  DELIVERY_IN: "Received",
  TASK_CONSUMPTION: "Task used",
  SITE_ADJUST: "Site corrected",
  GRN_IN: "Purchase received",
  CLEANER_ISSUE: "Cleaner stock issued",
  CLEANER_IN: "Cleaner stock received", CLEANER_ADJUST: "Cleaner stock corrected",
};

export const RequestStatusSchema = z.enum([
  "PENDING",
  "IN_REVIEW",
  "IN_PROGRESS",
  "PARTIALLY_FULFILLED",
  "APPROVED",
  "REJECTED",
  "FULFILLED",
  "CANCELLED",
]);
export type RequestStatus = z.infer<typeof RequestStatusSchema>;

export const DeliveryStatusSchema = z.enum(["PENDING", "PENDING_RECEIVED", "DELIVERED", "PARTIALLY_DELIVERED", "PENDING_DISPATCH", "DISPATCHED", "PENDING_APPROVAL", "RECEIVED", "CANCELLED"]);
export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;

export const RequestTypeSchema = z.enum(["SITE", "CLEANER"]);
export type RequestType = z.infer<typeof RequestTypeSchema>;

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  SITE: "Site restock",
  CLEANER: "Issue to cleaner",
};

// Where a request's items are supplied from — mirrors backend InventoryRequestSource.
export const RequestSourceSchema = z.enum(["WAREHOUSE", "CLIENT"]);
export type RequestSource = z.infer<typeof RequestSourceSchema>;

export const REQUEST_SOURCE_LABELS: Record<RequestSource, string> = {
  WAREHOUSE: "From warehouse",
  CLIENT: "From client",
};

// ── Items ───────────────────────────────────────────────────────────────────────

export const InventoryItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  itemCode: z.string().nullable().optional(),
  category: InventoryCategorySchema,
  unit: z.string(),
  unitPrice: z.number(),
  costPrice: z.number().nullable().optional(),
  minStock: z.number().nullable().optional(),
  lowStock: z.boolean().optional(),
  supplierId: z.string().uuid().nullable().optional(),
  supplierName: z.string().nullable().optional(),
  suppliers: z.array(z.object({ id: z.string().uuid(), name: z.string(), active: z.boolean() })).default([]),
  mainStockQuantity: z.number(),
  stockValue: z.number(),
  active: z.boolean(),
  hasPhoto: z.boolean().optional(),
  hasSds: z.boolean().optional(),
  sdsFilename: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
export const InventoryItemListSchema = z.array(InventoryItemSchema);
export type InventoryItem = z.infer<typeof InventoryItemSchema>;

export const ItemUnitStatusSchema = z.enum(["AVAILABLE", "ISSUED", "RETIRED"]);
export type ItemUnitStatus = z.infer<typeof ItemUnitStatusSchema>;

export const ITEM_UNIT_STATUS_LABELS: Record<ItemUnitStatus, string> = {
  AVAILABLE: "Available",
  ISSUED: "Issued",
  RETIRED: "Retired",
};

export const InventoryItemUnitSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  unitCode: z.string(),
  status: ItemUnitStatusSchema,
  createdAt: z.string().nullable().optional(),
});
export const InventoryItemUnitListSchema = z.array(InventoryItemUnitSchema);
export type InventoryItemUnit = z.infer<typeof InventoryItemUnitSchema>;

export const ItemFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(150, "Name is too long"),
  itemCode: z.string().max(60, "Item code is too long").optional().or(z.literal("")),
  category: InventoryCategorySchema,
  unit: z.string().min(1, "Unit is required").max(20, "Unit is too long"),
  unitPrice: z.number().min(0, "Price cannot be negative"),
  costPrice: z.number().min(0, "Cannot be negative").optional(),
  minStock: z.number().min(0, "Cannot be negative").optional(),
  supplierId: z.string().uuid("Supplier is required"),
  supplierIds: z.array(z.string().uuid()).optional(),
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
  cleanerId: z.string().uuid().nullable().optional(),
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

// ── Workflow event log ────────────────────────────────────────────────────────

export const INVENTORY_EVENT_TYPE_VALUES = [
  "REQUEST_ITEMS_EDITED", "REQUEST_STOCK_RESERVED", "REQUEST_SHORTAGE_CALCULATED", "REQUEST_PO_LINKED", "REQUEST_ALLOCATION_DECIDED", "REQUEST_RESERVATION_RELEASED",
  "PO_UPDATED", "PO_METHOD_CHANGED", "PO_PERSON_ASSIGNED", "PO_HAND_CARRY_STARTED", "PO_ITEMS_BROUGHT",
  "PO_EMAIL_QUEUED", "PO_EMAIL_FAILED", "PO_EMAIL_RESEND_REQUESTED", "PO_SUPPLIER_CONFIRMED", "PO_SUPPLIER_DISPATCHED",
  "REQUEST_CREATED",
  "STOCK_RECONCILED",
  "REQUEST_APPROVED",
  "REQUEST_REJECTED",
  "REQUEST_CANCELLED",
  "REQUEST_CLIENT_DISPATCHED",
  "DELIVERY_CREATED",
  "DELIVERY_DISPATCHED",
  "DELIVERY_RECEIVE_REPORTED",
  "DELIVERY_APPROVED",
  "DELIVERY_RECEIVED",
  "DELIVERY_CANCELLED",
  "PO_CREATED",
  "PO_SENT",
  "PO_STATUS_CHANGED",
  "PO_RECEIVED",
  "PO_CANCELLED",
] as const;
export const InventoryEventTypeSchema = z.enum(INVENTORY_EVENT_TYPE_VALUES);
export type InventoryEventType = z.infer<typeof InventoryEventTypeSchema>;

export const INVENTORY_EVENT_TYPE_LABELS: Record<InventoryEventType, string> = {
  REQUEST_ITEMS_EDITED: "Request items edited",
  REQUEST_STOCK_RESERVED: "Stock reserved",
  REQUEST_SHORTAGE_CALCULATED: "Shortage calculated",
  REQUEST_PO_LINKED: "Added to purchase order",
  REQUEST_ALLOCATION_DECIDED: "Quantity decision",
  REQUEST_RESERVATION_RELEASED: "Reservations released",
  PO_UPDATED: "PO updated",
  PO_METHOD_CHANGED: "Procurement method changed",
  PO_PERSON_ASSIGNED: "Person assigned",
  PO_HAND_CARRY_STARTED: "Hand Carry started",
  PO_ITEMS_BROUGHT: "Items brought",
  PO_EMAIL_QUEUED: "Supplier email queued",
  PO_EMAIL_FAILED: "Supplier email failed",
  PO_EMAIL_RESEND_REQUESTED: "Supplier email resend requested",
  PO_SUPPLIER_CONFIRMED: "Supplier confirmed",
  PO_SUPPLIER_DISPATCHED: "Supplier dispatched",
  REQUEST_CREATED: "Request created",
  STOCK_RECONCILED: "Stock confirmed",
  REQUEST_APPROVED: "Request approved",
  REQUEST_REJECTED: "Request rejected",
  REQUEST_CANCELLED: "Request cancelled",
  REQUEST_CLIENT_DISPATCHED: "Client dispatched",
  DELIVERY_CREATED: "Delivery queued",
  DELIVERY_DISPATCHED: "Delivery dispatched",
  DELIVERY_RECEIVE_REPORTED: "Receipt reported",
  DELIVERY_APPROVED: "Receipt approved",
  DELIVERY_RECEIVED: "Delivery received",
  DELIVERY_CANCELLED: "Delivery cancelled",
  PO_CREATED: "PO created",
  PO_SENT: "PO sent",
  PO_STATUS_CHANGED: "PO status changed",
  PO_RECEIVED: "PO received",
  PO_CANCELLED: "PO cancelled",
};

export const InventoryEventSchema = z.object({
  detailsJson: z.string().nullable().optional(),
  id: z.string().uuid(),
  eventType: InventoryEventTypeSchema,
  refType: z.string().nullable().optional(),
  refId: z.string().uuid().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  message: z.string().nullable().optional(),
  performedBy: z.string().uuid().nullable().optional(),
  performedByName: z.string().nullable().optional(),
  performedAt: z.string(),
});
export const InventoryEventListSchema = z.array(InventoryEventSchema);
export type InventoryEvent = z.infer<typeof InventoryEventSchema>;

// ── Requests ────────────────────────────────────────────────────────────────────

const RequestLineSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  originalQuantity: z.number().nullable().optional(),
  allocations: z.array(z.object({
    id: z.string().uuid(), source: z.enum(["WAREHOUSE", "CLIENT", "PURCHASE_ORDER"]),
    status: z.enum(["RESERVED", "APPROVED", "IN_DELIVERY", "RECEIVED", "PARTIALLY_RECEIVED", "REJECTED", "CANCELLED"]),
    quantity: z.number(), receivedQuantity: z.number(), purchaseOrderId: z.string().uuid().nullable().optional(),
    poNumber: z.string().nullable().optional(),
  })).default([]),
  itemId: z.string().uuid(),
  itemName: z.string(),
  unit: z.string(),
  requestedQuantity: z.number(),
});

export const InventoryRequestSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid().nullable().optional(),
  siteName: z.string().nullable().optional(),
  workflowVersion: z.number().nullable().optional(),
  version: z.number().default(0),
  reviewStep: z.number().nullable().optional(),
  assignedReceiverId: z.string().uuid().nullable().optional(),
  requestType: RequestTypeSchema.default("SITE"),
  source: RequestSourceSchema.default("WAREHOUSE"),
  targetCleanerId: z.string().uuid().nullable().optional(),
  targetCleanerName: z.string().nullable().optional(),
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
  purchaseOrderLineId: z.string().uuid().nullable().optional(),
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  itemName: z.string(),
  unit: z.string(),
  expectedQuantity: z.number(),
  confirmedQuantity: z.number().nullable().optional(),
  minStock: z.number().nullable().optional(),
});

export const InventoryDeliverySchema = z.object({
  workflowVersion: z.number().nullable().optional(),
  version: z.number().default(0),
  source: z.enum(["WAREHOUSE", "CLIENT", "SUPPLIER", "HAND_CARRY"]).nullable().optional(),
  procurementMethod: z.enum(["SUPPLIER_DELIVERY", "HAND_CARRY"]).nullable().optional(),
  orderType: z.enum(["WAREHOUSE", "SITE", "CLEANER"]).nullable().optional(),
  purchaseOrderId: z.string().uuid().nullable().optional(),
  poNumber: z.string().nullable().optional(),
  destinationAddress: z.string().nullable().optional(),
  assignedReceiverId: z.string().uuid().nullable().optional(),
  assignedReceiverName: z.string().nullable().optional(),
  handCarryPersonId: z.string().uuid().nullable().optional(),
  handCarryPersonName: z.string().nullable().optional(),
  handoverBy: z.string().uuid().nullable().optional(),
  handoverAt: z.string().nullable().optional(),
  overrideReason: z.string().nullable().optional(),
  id: z.string().uuid(),
  siteId: z.string().uuid().nullable().optional(),
  siteName: z.string().nullable().optional(),
  targetCleanerId: z.string().uuid().nullable().optional(),
  requestId: z.string().uuid().nullable().optional(),
  status: DeliveryStatusSchema,
  dispatchedBy: z.string().uuid().nullable().optional(),
  dispatchedByName: z.string().nullable().optional(),
  dispatchedAt: z.string().nullable().optional(),
  confirmedBy: z.string().uuid().nullable().optional(),
  confirmedByName: z.string().nullable().optional(),
  confirmedAt: z.string().nullable().optional(),
  approvedBy: z.string().uuid().nullable().optional(),
  approvedByName: z.string().nullable().optional(),
  approvedAt: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  lines: z.array(DeliveryLineSchema),
  createdAt: z.string().nullable().optional(),
});
export const InventoryDeliveryListSchema = z.array(InventoryDeliverySchema);
export type InventoryDelivery = z.infer<typeof InventoryDeliverySchema>;
export type InventoryDeliveryLine = z.infer<typeof DeliveryLineSchema>;

// ── Cleaner inventory ─────────────────────────────────────────────────────────

const CleanerInventoryLineSchema = z.object({
  itemId: z.string().uuid(),
  itemName: z.string(),
  unit: z.string(),
  category: InventoryCategorySchema,
  quantity: z.number(),
  minStock: z.number().nullable().optional(),
  lowStock: z.boolean().optional(),
});

export const CleanerInventorySchema = z.object({
  cleanerId: z.string().uuid(),
  cleanerName: z.string().nullable().optional(),
  items: z.array(CleanerInventoryLineSchema),
});
export type CleanerInventory = z.infer<typeof CleanerInventorySchema>;
export type CleanerInventoryLine = z.infer<typeof CleanerInventoryLineSchema>;

// ── Suppliers ───────────────────────────────────────────────────────────────────

export const SupplierSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  active: z.boolean(),
  clientSelfSupplying: z.boolean().default(false),
  siteId: z.string().uuid().nullable().optional(),
  siteName: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
export const SupplierListSchema = z.array(SupplierSchema);
export type Supplier = z.infer<typeof SupplierSchema>;

export const SupplierFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(150, "Name is too long"),
  email: z.string().min(1, "Email is required").email("Enter a valid email").max(150),
  phone: z.string().max(30, "Phone is too long").optional().or(z.literal("")),
  address: z.string().max(500, "Address is too long").optional().or(z.literal("")),
  clientSelfSupplying: z.boolean(),
  siteId: z.string().uuid().optional().or(z.literal("")),
});
export type SupplierFormInput = z.infer<typeof SupplierFormSchema>;

// ── Purchase orders ─────────────────────────────────────────────────────────────

export const PurchaseOrderStatusSchema = z.enum([
  "DRAFT",
  "AWAITING_SUPPLIER_CONFIRMATION", "CONFIRMED", "READY_FOR_PURCHASE", "PENDING_RECEIVED",
  "SENT",
  "AWAITING_CLIENT",
  "CLIENT_DISPATCHED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
]);
export type PurchaseOrderStatus = z.infer<typeof PurchaseOrderStatusSchema>;

export const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  AWAITING_SUPPLIER_CONFIRMATION: "Awaiting supplier confirmation",
  CONFIRMED: "Confirmed",
  READY_FOR_PURCHASE: "Ready for purchase",
  PENDING_RECEIVED: "Pending received",
  DRAFT: "Draft",
  SENT: "Sent",
  AWAITING_CLIENT: "Awaiting client",
  CLIENT_DISPATCHED: "Client dispatched",
  PARTIALLY_RECEIVED: "Partially received",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

const PurchaseOrderLineSchema = z.object({
  supplierId: z.string().uuid().nullable().optional(),
  supplierName: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  itemName: z.string(),
  unit: z.string(),
  quantity: z.number(),
  unitCost: z.number().nullable().optional(),
  receivedQuantity: z.number(),
});
export type PurchaseOrderLine = z.infer<typeof PurchaseOrderLineSchema>;

export const PurchaseOrderSchema = z.object({
  id: z.string().uuid(),
  poNumber: z.string(),
  supplierId: z.string().uuid().nullable().optional(),
  supplierName: z.string().nullable().optional(),
  workflowVersion: z.number().nullable().optional(),
  version: z.number().default(0),
  orderType: z.enum(["WAREHOUSE", "SITE", "CLEANER"]).optional(),
  procurementMethod: z.enum(["SUPPLIER_DELIVERY", "HAND_CARRY"]).nullable().optional(),
  cleanerId: z.string().uuid().nullable().optional(),
  assignedReceiverId: z.string().uuid().nullable().optional(),
  assignedReceiverName: z.string().nullable().optional(),
  handCarryPersonId: z.string().uuid().nullable().optional(),
  handCarryPersonName: z.string().nullable().optional(),
  cleanerName: z.string().nullable().optional(),
  suppliers: z.array(z.object({
    supplierId: z.string().uuid(), supplierName: z.string(), status: PurchaseOrderStatusSchema,
    recipientEmail: z.string().nullable().optional(), sendError: z.string().nullable().optional(),
    sentAt: z.string().nullable().optional(), confirmedAt: z.string().nullable().optional(), dispatchedAt: z.string().nullable().optional(),
  })).default([]),
  supplierEmail: z.string().nullable().optional(),
  clientSelfSupplying: z.boolean().default(false),
  siteId: z.string().uuid().nullable().optional(),
  siteName: z.string().nullable().optional(),
  status: PurchaseOrderStatusSchema,
  expectedDate: z.string().nullable().optional(),
  deliveryAddress: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  totalCost: z.number().nullable().optional(),
  lines: z.array(PurchaseOrderLineSchema),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
export const PurchaseOrderListSchema = z.array(PurchaseOrderSchema);
export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;

export const ProcurementCapabilitiesSchema = z.object({ enabled: z.boolean(), orderTypes: z.array(z.string()), procurementMethods: z.array(z.string()) });
export const InventoryPersonListSchema = z.array(z.object({ id: z.string().uuid(), name: z.string(), role: z.string() }));
export const InventoryReviewSchema = z.object({
  request: InventoryRequestSchema,
  stock: z.array(z.object({ lineId: z.string().uuid(), itemId: z.string().uuid(), currentStock: z.number(),
    warehouseStock: z.number(), warehouseAvailable: z.number(), shortageQuantity: z.number() })),
});
export const GeneratedInventoryPurchaseSchema = z.object({ review: InventoryReviewSchema, purchaseOrder: PurchaseOrderSchema });
export type InventoryReview = z.infer<typeof InventoryReviewSchema>;
export type PurchaseOrderType = "WAREHOUSE" | "SITE" | "CLEANER";
export type ProcurementMethod = "SUPPLIER_DELIVERY" | "HAND_CARRY";

export const LegacyPurchaseDraftPayloadSchema = z.object({
  supplierId: z.string().optional(), expectedDate: z.string().optional(), deliveryAddress: z.string().optional(), note: z.string().optional(),
  lines: z.array(z.object({ itemId: z.string(), quantity: z.union([z.string(), z.number()]), supplierId: z.string().optional(), note: z.string().optional() })).optional(),
});

// ── Goods receipts ──────────────────────────────────────────────────────────────

const GoodsReceiptLineSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  itemName: z.string(),
  unit: z.string(),
  quantity: z.number(),
  batchNumber: z.string().nullable().optional(),
  manufactureDate: z.string().nullable().optional(),
  expireDate: z.string().nullable().optional(),
  unitCost: z.number().nullable().optional(),
});

export const GoodsReceiptSchema = z.object({
  id: z.string().uuid(),
  grnNumber: z.string(),
  purchaseOrderId: z.string().uuid(),
  poNumber: z.string(),
  supplierName: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  receivedBy: z.string().uuid().nullable().optional(),
  receivedAt: z.string().nullable().optional(),
  lines: z.array(GoodsReceiptLineSchema),
});
export const GoodsReceiptListSchema = z.array(GoodsReceiptSchema);
export type GoodsReceipt = z.infer<typeof GoodsReceiptSchema>;

// ── Batches & expiry stats ──────────────────────────────────────────────────────

export const InventoryBatchSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  itemName: z.string(),
  unit: z.string(),
  batchNumber: z.string().nullable().optional(),
  quantity: z.number(),
  manufactureDate: z.string().nullable().optional(),
  expireDate: z.string().nullable().optional(),
  daysToExpiry: z.number().nullable().optional(),
  unitCost: z.number().nullable().optional(),
  supplierName: z.string().nullable().optional(),
  poNumber: z.string().nullable().optional(),
  grnNumber: z.string().nullable().optional(),
});
export const InventoryBatchListSchema = z.array(InventoryBatchSchema);
export type InventoryBatch = z.infer<typeof InventoryBatchSchema>;

export const InventoryStatsSchema = z.object({
  nearExpiryDays: z.number(),
  expiredQuantity: z.number(),
  expiredBatchCount: z.number(),
  nearExpiryQuantity: z.number(),
  nearExpiryBatchCount: z.number(),
  expiredBatches: z.array(InventoryBatchSchema),
  nearExpiryBatches: z.array(InventoryBatchSchema),
});
export type InventoryStats = z.infer<typeof InventoryStatsSchema>;
