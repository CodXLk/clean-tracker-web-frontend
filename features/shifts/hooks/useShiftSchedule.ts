"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

// Mirrors backend ShiftScheduleService.ShiftDay.
export const ShiftDaySchema = z.object({
  siteId: z.string().uuid(),
  siteName: z.string(),
  timezone: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  originalStart: z.string(),
  originalEnd: z.string(),
  moveMinutes: z.number(),
  startAt: z.string(),
  endAt: z.string(),
  checkInOpensAt: z.string(),
  checkInClosesAt: z.string(),
  pendingMoveId: z.string().uuid().nullable().optional(),
  pendingMoveMinutes: z.number().nullable().optional(),
  canMove: z.boolean(),
  moveNeedsApproval: z.boolean(),
});
export type ShiftDay = z.infer<typeof ShiftDaySchema>;

// Mirrors backend ShiftScheduleService.AdjustmentView.
export const ShiftMoveSchema = z.object({
  id: z.string().uuid(),
  cleanerName: z.string().nullable().optional(),
  siteId: z.string().uuid(),
  siteName: z.string(),
  date: z.string(),
  moveMinutes: z.number(),
  originalStart: z.string(),
  originalEnd: z.string(),
  status: z.string(),
  note: z.string().nullable().optional(),
  requestedAt: z.string().nullable().optional(),
});
export type ShiftMove = z.infer<typeof ShiftMoveSchema>;

const keys = {
  all: ["shift-schedule"] as const,
  mine: (from: string, to: string) => [...keys.all, "mine", from, to] as const,
  pending: () => [...keys.all, "pending"] as const,
};

export function useMyShiftSchedule(from: string, to: string) {
  return useQuery({
    queryKey: keys.mine(from, to),
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.shiftSchedule.mine, { params: { from, to } });
      return z.array(ShiftDaySchema).parse(data);
    },
  });
}

export function useMoveShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { siteId: string; date: string; moveMinutes: number; source?: "REMINDER" | "MANUAL" }) => {
      const { data } = await clientApi.post(ENDPOINTS.shiftSchedule.move, input);
      return ShiftDaySchema.parse(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all });
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function usePendingShiftMoves(enabled = true) {
  return useQuery({
    queryKey: keys.pending(),
    enabled,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.shiftSchedule.pendingMoves);
      return z.array(ShiftMoveSchema).parse(data);
    },
    refetchInterval: 60_000,
  });
}

export function useReviewShiftMove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; approve: boolean; note?: string }) => {
      const url = input.approve
        ? ENDPOINTS.shiftSchedule.approveMove(input.id)
        : ENDPOINTS.shiftSchedule.rejectMove(input.id);
      await clientApi.post(url, { note: input.note });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function formatMove(minutes: number): string {
  const sign = minutes > 0 ? "+" : minutes < 0 ? "−" : "";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h ? `${h}h` : ""}${h && m ? " " : ""}${m ? `${m}m` : ""}` || "0";
}
