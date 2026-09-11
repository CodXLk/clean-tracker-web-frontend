import { z } from "zod";

// Mirrors backend WorkOrderStatus.
export const WORK_ORDER_STATUS_VALUES = [
  "PENDING",
  "APPROVED",
  "ONGOING",
  "TASKS_COMPLETED",
  "PENDING_REVIEW",
  "COMPLETED",
] as const;
export const WorkOrderStatusSchema = z.enum(WORK_ORDER_STATUS_VALUES);
export type WorkOrderStatus = z.infer<typeof WorkOrderStatusSchema>;

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  ONGOING: "Ongoing",
  TASKS_COMPLETED: "Tasks Completed",
  PENDING_REVIEW: "Pending Review",
  COMPLETED: "Completed",
};

// Mirrors backend WorkOrderPriceType.
export const WORK_ORDER_PRICE_TYPE_VALUES = ["TOTAL_AMOUNT", "RATE_PER_HOUR"] as const;
export const WorkOrderPriceTypeSchema = z.enum(WORK_ORDER_PRICE_TYPE_VALUES);
export type WorkOrderPriceType = z.infer<typeof WorkOrderPriceTypeSchema>;

export const WORK_ORDER_PRICE_TYPE_LABELS: Record<WorkOrderPriceType, string> = {
  TOTAL_AMOUNT: "Total amount",
  RATE_PER_HOUR: "Rate per hour",
};

// One work-order cleaner slot — mirrors backend WorkOrderCleanerProfileResponse.
export const WorkOrderCleanerProfileSchema = z.object({
  id: z.string().uuid(),
  profileIndex: z.number(),
  label: z.string(),
  cleanerId: z.string().uuid().nullable().optional(),
  cleanerName: z.string().nullable().optional(),
});
export type WorkOrderCleanerProfile = z.infer<typeof WorkOrderCleanerProfileSchema>;
export const WorkOrderCleanerProfileListSchema = z.array(WorkOrderCleanerProfileSchema);

// One work-order supervisor slot — mirrors backend WorkOrderSupervisorProfileResponse.
export const WorkOrderSupervisorProfileSchema = z.object({
  id: z.string().uuid(),
  profileIndex: z.number(),
  label: z.string(),
  supervisorId: z.string().uuid().nullable().optional(),
  supervisorName: z.string().nullable().optional(),
});
export type WorkOrderSupervisorProfile = z.infer<typeof WorkOrderSupervisorProfileSchema>;
export const WorkOrderSupervisorProfileListSchema = z.array(WorkOrderSupervisorProfileSchema);

// One client-sent photo — mirrors backend WorkOrderPhotoResponse.
export const WorkOrderPhotoSchema = z.object({
  id: z.string().uuid(),
  originalFilename: z.string().nullable().optional(),
  contentType: z.string().nullable().optional(),
  sizeBytes: z.number().nullable().optional(),
  createdAt: z.string().nullable().optional(),
});
export type WorkOrderPhoto = z.infer<typeof WorkOrderPhotoSchema>;

// Mirrors backend WorkOrderResponse.
export const WorkOrderSchema = z.object({
  id: z.string().uuid(),
  poId: z.string(),
  siteId: z.string().uuid().nullable().optional(),
  siteName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  expectedDurationDays: z.number().nullable().optional(),
  taskDates: z.array(z.string()).default([]),
  numberOfCleaners: z.number().default(0),
  numberOfSupervisors: z.number().default(0),
  priceType: WorkOrderPriceTypeSchema.nullable().optional(),
  priceAmount: z.number().nullable().optional(),
  status: WorkOrderStatusSchema,
  cleanerProfiles: z.array(WorkOrderCleanerProfileSchema).default([]),
  supervisorProfiles: z.array(WorkOrderSupervisorProfileSchema).default([]),
  photos: z.array(WorkOrderPhotoSchema).default([]),
  taskCount: z.number().default(0),
  active: z.boolean().default(true),
  createdAt: z.string().nullable().optional(),
});
export type WorkOrder = z.infer<typeof WorkOrderSchema>;
export const WorkOrderListSchema = z.array(WorkOrderSchema);

// Outbound create payload — matches CreateWorkOrderRequest. Work-order dates come from its tasks.
export interface CreateWorkOrderInput {
  poId: string;
  siteId: string;
  description?: string;
  numberOfCleaners?: number;
  numberOfSupervisors?: number;
  priceType?: WorkOrderPriceType;
  priceAmount?: number;
}

// Outbound update payload — matches UpdateWorkOrderRequest (site is fixed).
export interface UpdateWorkOrderInput {
  poId: string;
  description?: string;
  numberOfCleaners?: number;
  numberOfSupervisors?: number;
  priceType?: WorkOrderPriceType;
  priceAmount?: number;
  status?: WorkOrderStatus;
}
