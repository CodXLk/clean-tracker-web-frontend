"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
export type Weekday = (typeof DAYS)[number];
export const WEEKDAYS = DAYS;

const money = z.union([z.number(), z.string()]).nullable().optional().transform((v) => (v == null ? null : Number(v)));
const optStr = z.string().nullable().optional();
const optNum = z.number().nullable().optional();

export const RateSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid().nullable().optional(),
  effectiveFrom: z.string(),
  cleaningRateType: z.enum(["HOURLY", "PER_VISIT"]),
  cleaningHourlyRate: money,
  cleaningPerVisitAmount: money,
  agreedMinutesPerDay: optNum,
  agreedMinutesByDay: z.record(z.string(), z.number()).default({}),
  supervisionHourlyRate: money,
  supervisionAgreedMinutesPerDay: optNum,
  weekendMultiplier: money,
  publicHolidayMultiplier: money,
  supervisionWeekendMultiplier: money,
  supervisionPublicHolidayMultiplier: money,
});
export type Rate = z.infer<typeof RateSchema>;

export interface RateInput {
  effectiveFrom: string;
  cleaningRateType: "HOURLY" | "PER_VISIT";
  cleaningHourlyRate?: number | null;
  cleaningPerVisitAmount?: number | null;
  agreedMinutesPerDay?: number | null;
  agreedMinutesByDay?: Partial<Record<Weekday, number>>;
  supervisionHourlyRate?: number | null;
  supervisionAgreedMinutesPerDay?: number | null;
  weekendMultiplier?: number | null;
  publicHolidayMultiplier?: number | null;
  supervisionWeekendMultiplier?: number | null;
  supervisionPublicHolidayMultiplier?: number | null;
}

export const AgreedHoursSchema = z.object({
  id: z.string().uuid(),
  cleanerId: z.string().uuid(),
  cleanerName: optStr,
  effectiveFrom: z.string(),
  agreedMinutesPerDay: z.number(),
});
export type AgreedHours = z.infer<typeof AgreedHoursSchema>;

export const PersonSchema = z.object({
  userId: z.string().uuid(),
  name: z.string(),
  email: optStr,
  roles: z.array(z.string()).default([]),
});
export type InvoicePerson = z.infer<typeof PersonSchema>;

export const SECTIONS = [
  "REGULAR_SITE",
  "COVER",
  "WORK_ORDER",
  "SUPERVISION",
  "SUPERVISION_COVER",
  "SUPERVISION_WO",
  "HAND_CARRY",
] as const;
export type InvoiceSection = (typeof SECTIONS)[number];
export type PartRole = "CLEANER" | "SUPERVISOR";

export const InvoiceLineSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["CLEANER", "SUPERVISOR"]),
  section: z.enum(SECTIONS),
  lineDate: optStr,
  siteId: z.string().uuid().nullable().optional(),
  siteName: optStr,
  workOrderId: z.string().uuid().nullable().optional(),
  poId: optStr,
  description: optStr,
  actualMinutes: optNum,
  agreedMinutes: optNum,
  defaultMinutes: optNum,
  claimedMinutes: optNum,
  approvedMinutes: optNum,
  finalMinutes: z.number(),
  rateType: z.enum(["HOURLY", "PER_VISIT", "TOTAL"]).nullable().optional(),
  systemRate: money,
  approvedRate: money,
  finalRate: money,
  multiplier: money,
  defaultAmount: money,
  claimedAmount: money,
  approvedAmount: money,
  amount: money,
  locked: z.boolean(),
  lockReason: optStr,
  needsReview: z.boolean(),
  problem: optStr,
  note: optStr,
  adminNote: optStr,
  editable: z.boolean(),
  missingHours: z.boolean().default(false),
  personMinutes: optNum,
  personAmount: money,
  purchaseOrderId: z.string().uuid().nullable().optional(),
  deliveryId: z.string().uuid().nullable().optional(),
  items: z.array(z.string()).default([]),
});
export type InvoiceLine = z.infer<typeof InvoiceLineSchema>;

export const STATUSES = ["DRAFT", "PENDING", "REJECTED", "APPROVED", "PAID"] as const;
export type InvoiceStatus = (typeof STATUSES)[number];

const PartSchema = z.object({
  role: z.enum(["CLEANER", "SUPERVISOR"]),
  label: z.string(),
  completed: z.boolean(),
  completedAt: optStr,
  lineCount: z.number(),
  total: money,
  problems: z.number(),
  awaitingReview: z.number(),
});
export type InvoicePart = z.infer<typeof PartSchema>;

const PermissionsSchema = z.object({
  ownerEdit: z.boolean(),
  completeParts: z.boolean(),
  submit: z.boolean(),
  changePeriod: z.boolean(),
  delete: z.boolean(),
  refresh: z.boolean(),
  managerEdit: z.boolean(),
  approve: z.boolean(),
  reject: z.boolean(),
  reopen: z.boolean(),
  markPaid: z.boolean(),
  viewHistory: z.boolean(),
});
export type InvoicePermissions = z.infer<typeof PermissionsSchema>;

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  number: z.string(),
  personUserId: z.string().uuid(),
  personName: optStr,
  personEmail: optStr,
  periodFrom: z.string(),
  periodTo: z.string(),
  status: z.enum(STATUSES),
  totalAmount: money,
  notes: optStr,
  version: z.number().default(0),
  rejectionReason: optStr,
  awaitingReviewLines: z.number().default(0),
  problemLines: z.number().default(0),
  parts: z.array(PartSchema).default([]),
  lines: z.array(InvoiceLineSchema).default([]),
  can: PermissionsSchema,
  createdAt: optStr,
  updatedAt: optStr,
  submittedAt: optStr,
  approvedAt: optStr,
  rejectedAt: optStr,
  paidAt: optStr,
  pendingPurchases: z.array(z.string()).default([]),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

const SnapshotLineSchema = z.object({
  key: z.string(),
  role: z.string(),
  section: z.string(),
  date: optStr,
  siteName: optStr,
  poId: optStr,
  description: optStr,
  actualMinutes: optNum,
  agreedMinutes: optNum,
  defaultMinutes: optNum,
  claimedMinutes: optNum,
  approvedMinutes: optNum,
  finalMinutes: z.number(),
  rateType: optStr,
  rate: money,
  multiplier: money,
  claimedAmount: money,
  approvedAmount: money,
  amount: money,
  locked: z.boolean(),
  lockReason: optStr,
  needsReview: z.boolean(),
  problem: optStr,
  note: optStr,
  adminNote: optStr,
  items: optStr,
});
export type SnapshotLine = z.infer<typeof SnapshotLineSchema>;

const SnapshotSchema = z.object({
  number: z.string(),
  status: z.string(),
  version: z.number(),
  periodFrom: z.string(),
  periodTo: z.string(),
  totalAmount: money,
  notes: optStr,
  rejectionReason: optStr,
  parts: z.array(z.object({ role: z.string(), completed: z.boolean(), completedAt: optStr, total: money })).default([]),
  lines: z.array(SnapshotLineSchema).default([]),
});
export type InvoiceSnapshot = z.infer<typeof SnapshotSchema>;

export const InvoiceEventSchema = z.object({
  id: z.string().uuid(),
  action: z.string(),
  fromStatus: optStr,
  toStatus: optStr,
  version: optNum,
  actorUserId: z.string().uuid().nullable().optional(),
  actorFirstName: optStr,
  actorLastName: optStr,
  actorRole: optStr,
  comment: optStr,
  details: z.array(z.string()).default([]),
  totalAmount: money,
  createdAt: z.string(),
  snapshot: SnapshotSchema.nullable().optional().catch(null),
});
export type InvoiceEvent = z.infer<typeof InvoiceEventSchema>;

const AccessSchema = z.object({ eligible: z.boolean(), roles: z.array(z.string()).default([]) });

const keys = {
  all: ["invoices"] as const,
  list: (status: string | null) => [...keys.all, "list", status ?? "all"] as const,
  mine: () => [...keys.all, "mine"] as const,
  access: () => [...keys.all, "access"] as const,
  one: (id: string) => [...keys.all, "one", id] as const,
  history: (id: string) => [...keys.all, "history", id] as const,
  people: () => [...keys.all, "people"] as const,
  rates: (siteId: string | null) => [...keys.all, "rates", siteId ?? "default"] as const,
  agreed: (siteId: string) => [...keys.all, "agreed", siteId] as const,
};

export function useInvoices(status: InvoiceStatus | null = null) {
  return useQuery({
    queryKey: keys.list(status),
    queryFn: async () =>
      z.array(InvoiceSchema).parse(
        (await clientApi.get(status ? `${ENDPOINTS.invoices.list}?status=${status}` : ENDPOINTS.invoices.list)).data,
      ),
  });
}

export function useMyInvoices(enabled = true) {
  return useQuery({
    queryKey: keys.mine(),
    enabled,
    queryFn: async () => z.array(InvoiceSchema).parse((await clientApi.get(ENDPOINTS.invoices.mine)).data),
  });
}

/** Whether the signed-in user has invoices (in-house cleaner/supervisor). */
export function useInvoiceAccess(enabled = true) {
  return useQuery({
    queryKey: keys.access(),
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => AccessSchema.parse((await clientApi.get(ENDPOINTS.invoices.access)).data),
  });
}

export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: keys.one(id ?? ""),
    enabled: !!id,
    queryFn: async () => InvoiceSchema.parse((await clientApi.get(ENDPOINTS.invoices.byId(id!))).data),
  });
}

export function useInvoiceHistory(id: string | null, enabled = true) {
  return useQuery({
    queryKey: keys.history(id ?? ""),
    enabled: !!id && enabled,
    queryFn: async () => z.array(InvoiceEventSchema).parse((await clientApi.get(ENDPOINTS.invoices.history(id!))).data),
  });
}

export function useInvoicePeople(enabled = true) {
  return useQuery({
    queryKey: keys.people(),
    enabled,
    queryFn: async () => z.array(PersonSchema).parse((await clientApi.get(ENDPOINTS.invoices.people)).data),
  });
}

export function useRates(siteId: string | null, enabled = true) {
  return useQuery({
    queryKey: keys.rates(siteId),
    enabled,
    queryFn: async () =>
      z.array(RateSchema).parse(
        (await clientApi.get(siteId ? ENDPOINTS.invoices.siteRates(siteId) : ENDPOINTS.invoices.defaultRates)).data,
      ),
  });
}

export function useAgreedHours(siteId: string | null) {
  return useQuery({
    queryKey: keys.agreed(siteId ?? ""),
    enabled: !!siteId,
    queryFn: async () => z.array(AgreedHoursSchema).parse((await clientApi.get(ENDPOINTS.invoices.agreedHours(siteId!))).data),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: keys.all });
}

export function useAddRate() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ siteId, input }: { siteId: string | null; input: RateInput }) => {
      await clientApi.post(siteId ? ENDPOINTS.invoices.siteRates(siteId) : ENDPOINTS.invoices.defaultRates, input);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteRate() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (rateId: string) => {
      await clientApi.delete(ENDPOINTS.invoices.rate(rateId));
    },
    onSuccess: invalidate,
  });
}

export function useAddAgreedHours() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: { siteId: string; cleanerId: string; effectiveFrom: string; agreedMinutesPerDay: number }) => {
      const { siteId, ...body } = input;
      await clientApi.post(ENDPOINTS.invoices.agreedHours(siteId), body);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteAgreedHours() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.invoices.agreedHoursItem(id));
    },
    onSuccess: invalidate,
  });
}

/** Creates a draft (for yourself when personUserId is omitted). Overlapping one of the person's drafts merges into it. */
export function useCreateInvoice() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: { personUserId?: string; from: string; to: string; notes?: string }) =>
      InvoiceSchema.parse((await clientApi.post(ENDPOINTS.invoices.list, input)).data),
    onSuccess: invalidate,
  });
}

export type InvoiceAction = "refresh" | "submit" | "approve" | "reject" | "reopen" | "paid" | "delete";

export function useInvoiceAction() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, action, comment }: { id: string; action: InvoiceAction; comment?: string }) => {
      if (action === "delete") {
        await clientApi.delete(ENDPOINTS.invoices.byId(id));
        return;
      }
      const body = action === "approve" ? { comment } : action === "reject" || action === "reopen" ? { reason: comment } : {};
      await clientApi.post(ENDPOINTS.invoices.action(id, action), body);
    },
    onSuccess: invalidate,
  });
}

export function useInvoicePart() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, role, action }: { id: string; role: PartRole; action: "complete" | "reopen" }) => {
      await clientApi.post(ENDPOINTS.invoices.part(id, role, action));
    },
    onSuccess: invalidate,
  });
}

export function useChangeInvoicePeriod() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, from, to }: { id: string; from: string; to: string }) => {
      await clientApi.put(ENDPOINTS.invoices.period(id), { from, to });
    },
    onSuccess: invalidate,
  });
}

export interface LineEditInput {
  id: string;
  lineId: string;
  finalMinutes?: number | null;
  finalAmount?: number | null;
  rate?: number | null;
  note?: string | null;
  reset?: boolean;
}

export function useEditInvoiceLine() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, lineId, ...body }: LineEditInput) => {
      await clientApi.put(ENDPOINTS.invoices.line(id, lineId), body);
    },
    onSuccess: invalidate,
  });
}

/** Several line edits in one request (e.g. management changing a site's rate on every day). */
export function useEditInvoiceLines() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, edits }: { id: string; edits: Omit<LineEditInput, "id">[] }) => {
      await clientApi.put(ENDPOINTS.invoices.lines(id), { edits });
    },
    onSuccess: invalidate,
  });
}

export function useSaveInvoiceNotes() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      await clientApi.put(ENDPOINTS.invoices.notes(id), { notes });
    },
    onSuccess: invalidate,
  });
}

export function formatMoney(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
}

export function hoursText(m?: number | null): string {
  return m == null ? "—" : (m / 60).toFixed(2);
}

export const SECTION_LABELS: Record<InvoiceSection, string> = {
  REGULAR_SITE: "General cleaning",
  COVER: "Cover cleaning",
  WORK_ORDER: "Work orders",
  SUPERVISION: "Supervision / inspections",
  SUPERVISION_COVER: "Supervision covers",
  SUPERVISION_WO: "Work order supervision",
  HAND_CARRY: "Hand-carry purchases",
};

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending approval",
  REJECTED: "Returned for changes",
  APPROVED: "Approved",
  PAID: "Paid",
};

export const STATUS_TONE: Record<InvoiceStatus, string> = {
  DRAFT: "bg-grey-100 text-grey-700",
  PENDING: "bg-status-pending/10 text-status-pending",
  REJECTED: "bg-error/10 text-error",
  APPROVED: "bg-primary/10 text-ink",
  PAID: "bg-success/10 text-success",
};

export const ACTION_LABELS: Record<string, string> = {
  CREATED: "Draft created",
  PERIOD_CHANGED: "Dates changed",
  LINE_EDITED: "Line edited",
  NOTES_EDITED: "Notes edited",
  HOURS_UPDATED: "Hours records changed",
  PART_COMPLETED: "Part completed",
  PART_REOPENED: "Part reopened",
  BACK_TO_DRAFT: "Back to draft",
  SUBMITTED: "Submitted for approval",
  APPROVED: "Approved",
  REJECTED: "Returned for changes",
  REOPENED: "Approved invoice reopened",
  PAID: "Marked paid",
};
