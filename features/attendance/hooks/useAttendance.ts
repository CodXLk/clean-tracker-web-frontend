"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  AttendanceLogListSchema,
  AttendanceLogSchema,
  CleanerSiteListSchema,
  type AttendanceLog,
  type CheckInPayload,
  type CleanerSite,
} from "@/features/attendance/schemas/attendance.schema";

export const attendanceKeys = {
  all: ["attendance"] as const,
  mySites: (date?: string) => [...attendanceKeys.all, "my-sites", date ?? "today"] as const,
  logs: (filters: AttendanceLogFilters) => [...attendanceKeys.all, "logs", filters] as const,
  me: () => [...attendanceKeys.all, "me"] as const,
};

export interface AttendanceLogFilters {
  cleanerId?: string;
  siteId?: string;
  from?: string;
  to?: string;
}

async function fetchMySites(date?: string): Promise<CleanerSite[]> {
  const { data } = await clientApi.get(ENDPOINTS.attendance.mySites, {
    params: date ? { date } : undefined,
  });
  return CleanerSiteListSchema.parse(data);
}

export function useMySites(date?: string) {
  return useQuery({
    queryKey: attendanceKeys.mySites(date),
    queryFn: () => fetchMySites(date),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CheckInPayload) => {
      const { data } = await clientApi.post(ENDPOINTS.attendance.checkIn, payload);
      return AttendanceLogSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CheckInPayload) => {
      const { data } = await clientApi.post(ENDPOINTS.attendance.checkOut, payload);
      return AttendanceLogSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
  });
}

async function fetchLogs(filters: AttendanceLogFilters): Promise<AttendanceLog[]> {
  const params: Record<string, string> = {};
  if (filters.cleanerId) params.cleanerId = filters.cleanerId;
  if (filters.siteId) params.siteId = filters.siteId;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  const { data } = await clientApi.get(ENDPOINTS.attendance.logs, {
    params: Object.keys(params).length ? params : undefined,
  });
  return AttendanceLogListSchema.parse(data);
}

export function useAttendanceLogs(filters: AttendanceLogFilters = {}) {
  return useQuery({
    queryKey: attendanceKeys.logs(filters),
    queryFn: () => fetchLogs(filters),
  });
}

async function fetchMyAttendanceHistory(): Promise<AttendanceLog[]> {
  const { data } = await clientApi.get(ENDPOINTS.attendance.me);
  return AttendanceLogListSchema.parse(data);
}

/** The calling cleaner's own full attendance history (all sites, all dates). */
export function useMyAttendanceHistory() {
  return useQuery({
    queryKey: attendanceKeys.me(),
    queryFn: fetchMyAttendanceHistory,
  });
}
