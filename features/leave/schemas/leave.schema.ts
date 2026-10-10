import { z } from "zod";

export const LEAVE_TYPES = ["DAY_WISE", "SITE_SPECIFIC"] as const;
export const LEAVE_STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;

export const LeaveCoverSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  siteName: z.string().nullable().optional(),
  coveringUserId: z.string().uuid(),
  coveringCleanerId: z.string().uuid().nullable().optional(),
  coveringName: z.string().nullable().optional(),
  approvalStatus: z.enum(["PENDING", "APPROVED"]),
  approvedAt: z.string().nullable().optional(),
});
export type LeaveCover = z.infer<typeof LeaveCoverSchema>;

export const LeaveSiteRefSchema = z.object({
  siteId: z.string().uuid(),
  siteName: z.string(),
});
export type LeaveSiteRef = z.infer<typeof LeaveSiteRefSchema>;

export const LeaveRequestSchema = z.object({
  id: z.string().uuid(),
  requesterUserId: z.string().uuid(),
  requesterName: z.string().nullable().optional(),
  requesterRole: z.string().nullable().optional(),
  type: z.enum(LEAVE_TYPES),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().nullable().optional(),
  status: z.enum(LEAVE_STATUSES),
  affectedSites: z.array(LeaveSiteRefSchema).default([]),
  covers: z.array(LeaveCoverSchema).default([]),
  createdAt: z.string().nullable().optional(),
});
export type LeaveRequest = z.infer<typeof LeaveRequestSchema>;
export const LeaveRequestListSchema = z.array(LeaveRequestSchema);

export const MyLeaveCoverSchema = z.object({
  coverId: z.string().uuid(),
  leaveRequestId: z.string().uuid(),
  siteId: z.string().uuid(),
  siteName: z.string().nullable().optional(),
  requesterName: z.string().nullable().optional(),
  startDate: z.string(),
  endDate: z.string(),
});
export type MyLeaveCover = z.infer<typeof MyLeaveCoverSchema>;
export const MyLeaveCoverListSchema = z.array(MyLeaveCoverSchema);

export interface CreateLeaveInput {
  type: (typeof LEAVE_TYPES)[number];
  startDate: string;
  endDate: string;
  siteIds?: string[];
  reason?: string;
}
