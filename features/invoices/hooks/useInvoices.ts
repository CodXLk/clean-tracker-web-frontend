"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
export type Weekday = (typeof DAYS)[number];
export const WEEKDAYS = DAYS;

const money = z.union([z.number(), z.string()]).nullable().optional().transform((v) => (v == null ? null : Number(v)));

export const RateSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid().nullable().optional(),
  effectiveFrom: z.string(),
  cleaningRateType: z.enum(["HOURLY", "PER_VISIT"]),
  cleaningHourlyRate: money,
  cleaningPerVisitAmount: money,
  agreedMinutesPerDay: z.number().nullable().optional(),
  agreedMinutesByDay: z.record(z.string(), z.number()).default({}),
  supervisionHourlyRate: money,
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
  weekendMultiplier?: number | null;
  publicHolidayMultiplier?: number | null;
  supervisionWeekendMultiplier?: number | null;
  supervisionPublicHolidayMultiplier?: number | null;
}

export const AgreedHoursSchema = z.object({
  id: z.string().uuid(),
  cleanerId: z.string().uuid(),
  cleanerName: z.string().nullable().optional(),
  effectiveFrom: z.string(),
  agreedMinutesPerDay: z.number(),
});
export type AgreedHours = z.infer<typeof AgreedHoursSchema>;

export const PersonSchema = z.object({
  userId: z.string().uuid(),
  name: z.string(),
  email: z.string().nullable().optional(),
  roles: z.array(z.string()).default([]),
});
export type InvoicePerson = z.infer<typeof PersonSchema>;

export const InvoiceLineSchema = z.object({
  id: z.string().uuid(),
  section: z.enum(["REGULAR_SITE", "WORK_ORDER", "SUPERVISION", "COVER"]),
  lineDate: z.string().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  siteName: z.string().nullable().optional(),
  workOrderId: z.string().uuid().nullable().optional(),
  poId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  actualMinutes: z.number().nullable().optional(),
  agreedMinutes: z.number().nullable().optional(),
  finalMinutes: z.number(),
  rateType: z.enum(["HOURLY", "PER_VISIT", "TOTAL"]).nullable().optional(),
  systemRate: money,
  finalRate: money,
  multiplier: money,
  amount: money,
  approved: z.boolean(),
  note: z.string().nullable().optional(),
});
export type InvoiceLine = z.infer<typeof InvoiceLineSchema>;

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  number: z.string(),
  personUserId: z.string().uuid(),
  personName: z.string().nullable().optional(),
  personEmail: z.string().nullable().optional(),
  periodFrom: z.string(),
  periodTo: z.string(),
  status: z.enum(["DRAFT", "FINAL", "PAID"]),
  totalAmount: money,
  notes: z.string().nullable().optional(),
  unapprovedLines: z.number(),
  lines: z.array(InvoiceLineSchema).default([]),
  createdAt: z.string().nullable().optional(),
  finalizedAt: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

const keys = {
  all: ["invoices"] as const,
  list: () => [...keys.all, "list"] as const,
  one: (id: string) => [...keys.all, "one", id] as const,
  people: () => [...keys.all, "people"] as const,
  rates: (siteId: string | null) => [...keys.all, "rates", siteId ?? "default"] as const,
  agreed: (siteId: string) => [...keys.all, "agreed", siteId] as const,
};

export function useInvoices() {
  return useQuery({
    queryKey: keys.list(),
    queryFn: async () => z.array(InvoiceSchema).parse((await clientApi.get(ENDPOINTS.invoices.list)).data),
  });
}

export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: keys.one(id ?? ""),
    enabled: !!id,
    queryFn: async () => InvoiceSchema.parse((await clientApi.get(ENDPOINTS.invoices.byId(id!))).data),
  });
}

export function useInvoicePeople() {
  return useQuery({
    queryKey: keys.people(),
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

export function useCreateInvoice() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: { personUserId: string; from: string; to: string; notes?: string }) =>
      InvoiceSchema.parse((await clientApi.post(ENDPOINTS.invoices.list, input)).data),
    onSuccess: invalidate,
  });
}

export function useInvoiceAction() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "regenerate" | "finalize" | "paid" | "reopen" | "delete" }) => {
      if (action === "delete") {
        await clientApi.delete(ENDPOINTS.invoices.byId(id));
        return;
      }
      await clientApi.post(ENDPOINTS.invoices.action(id, action));
    },
    onSuccess: invalidate,
  });
}

export function useEditInvoiceLine() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: { id: string; lineId: string; finalRate?: number | null; note?: string | null }) => {
      await clientApi.put(ENDPOINTS.invoices.line(input.id, input.lineId), {
        finalRate: input.finalRate ?? null,
        note: input.note ?? null,
      });
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

export const SECTION_LABELS: Record<InvoiceLine["section"], string> = {
  REGULAR_SITE: "General cleaning",
  COVER: "Cover cleaning",
  SUPERVISION: "Supervision",
  WORK_ORDER: "Work orders",
};
