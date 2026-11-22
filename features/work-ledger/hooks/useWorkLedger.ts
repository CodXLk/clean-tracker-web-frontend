"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

// Mirrors backend WorkLedgerService.Entry.
export const WorkEntrySchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  siteName: z.string(),
  workDate: z.string(),
  personUserId: z.string().uuid(),
  cleanerId: z.string().uuid().nullable().optional(),
  personName: z.string().nullable().optional(),
  context: z.enum(["GENERAL", "SUPERVISION"]),
  status: z.enum([
    "WORKED",
    "COVER",
    "LEAVE_COVERED",
    "LEAVE_UNCOVERED",
    "ABSENT",
    "EXTRA",
    "HOLIDAY",
    "PENDING_ACCEPTANCE",
  ]),
  coveredName: z.string().nullable().optional(),
  coveredByName: z.string().nullable().optional(),
  agreedMinutes: z.number().nullable().optional(),
  grossMinutes: z.number(),
  pausedMinutes: z.number(),
  workedMinutes: z.number(),
  sessionCount: z.number(),
  systemMinutes: z.number(),
  supervisorMinutes: z.number().nullable().optional(),
  adminMinutes: z.number().nullable().optional(),
  finalMinutes: z.number(),
  reviewStatus: z.enum(["SYSTEM", "SUPERVISOR_REVIEWED", "APPROVED", "REOPENED"]),
  sourceChanged: z.boolean(),
  supervisorNote: z.string().nullable().optional(),
  adminNote: z.string().nullable().optional(),
  reviewedAt: z.string().nullable().optional(),
  approvedAt: z.string().nullable().optional(),
  invoiceId: z.string().uuid().nullable().optional(),
  canReview: z.boolean(),
  canApprove: z.boolean(),
  minimumMinutes: z.number().nullable().optional(),
  minimumMandatory: z.boolean().nullable().optional(),
  thresholdPercent: z.number().nullable().optional(),
  workedPercent: z.number().nullable().optional(),
  belowMinimum: z.boolean().optional().default(false),
  autoReviewed: z.boolean().optional().default(false),
  sessions: z
    .array(
      z.object({
        id: z.string().uuid(),
        checkInAt: z.string().nullable().optional(),
        checkOutAt: z.string().nullable().optional(),
        scheduledStartAt: z.string().nullable().optional(),
        scheduledEndAt: z.string().nullable().optional(),
        status: z.string().nullable().optional(),
        closeReason: z.string().nullable().optional(),
        grossMinutes: z.number(),
        pausedMinutes: z.number(),
        workedMinutes: z.number(),
        workedPercent: z.number().nullable().optional(),
        lateMinutes: z.number().nullable().optional(),
        timezone: z.string().nullable().optional(),
        pauses: z
          .array(
            z.object({
              pausedAt: z.string().nullable().optional(),
              resumedAt: z.string().nullable().optional(),
              reason: z.string().nullable().optional(),
              /** CLEANER / AUTO / SESSION_END */
              resumedBy: z.string().nullable().optional(),
            }),
          )
          .default([]),
        checkedOutBy: z.string().nullable().optional(),
        closedAt: z.string().nullable().optional(),
        checkoutNote: z.string().nullable().optional(),
        earlyCheckInMinutes: z.number().nullable().optional(),
        lateCheckOutMinutes: z.number().nullable().optional(),
        windowLeftMinutes: z.number().nullable().optional(),
      }),
    )
    .default([]),
});
export type WorkEntry = z.infer<typeof WorkEntrySchema>;
export type WorkSession = WorkEntry["sessions"][number];

export interface WorkLedgerFilters {
  siteId?: string;
  from: string;
  to: string;
}

const keys = {
  all: ["work-ledger"] as const,
  list: (f: WorkLedgerFilters, refresh: boolean) => [...keys.all, f, refresh] as const,
};

export function useWorkLedger(filters: WorkLedgerFilters, refresh: boolean) {
  return useQuery({
    queryKey: keys.list(filters, refresh),
    queryFn: async () => {
      const params: Record<string, string> = { from: filters.from, to: filters.to };
      if (filters.siteId) params.siteId = filters.siteId;
      if (refresh) params.refresh = "true";
      const { data } = await clientApi.get(ENDPOINTS.workLedger.list, { params });
      return z.array(WorkEntrySchema).parse(data);
    },
  });
}

export type ReviewAction = "review" | "approve" | "reopen";

export function useWorkLedgerAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      action: ReviewAction;
      items: { id: string; minutes?: number | null }[];
      note?: string;
    }) => {
      if (input.action === "reopen") {
        await clientApi.post(ENDPOINTS.workLedger.reopen, { ids: input.items.map((i) => i.id), note: input.note });
        return;
      }
      const url = input.action === "review" ? ENDPOINTS.workLedger.review : ENDPOINTS.workLedger.approve;
      await clientApi.post(url, { items: input.items, note: input.note });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export const WORK_STATUS_LABELS: Record<WorkEntry["status"], string> = {
  WORKED: "Worked",
  COVER: "Cover",
  LEAVE_COVERED: "Leave (covered)",
  LEAVE_UNCOVERED: "Leave (no cover)",
  ABSENT: "Absent",
  EXTRA: "Extra",
  HOLIDAY: "Public holiday",
  PENDING_ACCEPTANCE: "Leave (cover pending)",
};

export const REVIEW_STATUS_LABELS: Record<WorkEntry["reviewStatus"], string> = {
  SYSTEM: "To review",
  SUPERVISOR_REVIEWED: "Reviewed",
  APPROVED: "Approved",
  REOPENED: "Reopened",
};

export const PAUSE_REASON_LABELS: Record<string, string> = {
  GEOFENCE: "Left the site",
  STALE_HEARTBEAT: "No signal / app closed",
  LOCATION_UNAVAILABLE: "Location unavailable",
  APP_CLOSED: "App closed",
};
