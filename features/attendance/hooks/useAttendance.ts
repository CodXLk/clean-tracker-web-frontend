"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { getCurrentPosition } from "@/lib/geolocation";
import {
  AttendanceLogListSchema,
  AttendanceLogSchema,
  CleanerSiteListSchema,
  type AttendanceLog,
  type CheckInPayload,
  type CleanerSite,
  type HeartbeatPayload,
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

export function useHeartbeat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: HeartbeatPayload) => {
      const { data } = await clientApi.post(ENDPOINTS.attendance.heartbeat, payload);
      return AttendanceLogSchema.parse(data);
    },
    // A ping may flip the shift to PAUSED — refresh so the UI reflects it.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
  });
}

const HEARTBEAT_INTERVAL_MS = 15 * 60 * 1000;

/**
 * While the cleaner is checked in at a geolocated site, sends a location heartbeat every
 * 15 minutes. If a ping lands outside the geofence — or the location can't be obtained — the
 * server pauses the shift. Also pauses (best-effort) when the app/tab is closed or backgrounded,
 * so reopening shows the shift as paused. Only runs while the app is open.
 */
export function useAttendanceHeartbeat(sites: CleanerSite[]) {
  const heartbeat = useHeartbeat();
  const activeSiteId =
    sites.find((s) => s.status === "CHECKED_IN" && s.hasCoordinates)?.siteId ?? null;
  // Any actively checked-in site (even without coordinates) — used for the close/pause beacon.
  const checkedInSiteId = sites.find((s) => s.status === "CHECKED_IN")?.siteId ?? null;

  useEffect(() => {
    if (!activeSiteId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const pos = await getCurrentPosition();
        if (cancelled) return;
        await heartbeat.mutateAsync({
          siteId: activeSiteId,
          latitude: pos.lat,
          longitude: pos.lng,
          accuracyMeters: pos.accuracy,
        });
      } catch {
        // Location unreachable (permission/timeout) — pause the shift.
        if (cancelled) return;
        try {
          await heartbeat.mutateAsync({ siteId: activeSiteId, unreachable: true });
        } catch {
          /* best-effort */
        }
      }
    };
    const id = setInterval(tick, HEARTBEAT_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // heartbeat mutation identity is stable enough; re-run only when the active site changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSiteId]);

  // Pause the shift when the app/tab is closed or sent to the background (best-effort beacon).
  useEffect(() => {
    if (!checkedInSiteId) return;
    const pauseBeacon = () => {
      if (typeof navigator === "undefined" || !navigator.sendBeacon) return;
      const blob = new Blob([JSON.stringify({ siteId: checkedInSiteId })], {
        type: "application/json",
      });
      navigator.sendBeacon(`/api${ENDPOINTS.attendance.pause}`, blob);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") pauseBeacon();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", pauseBeacon);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", pauseBeacon);
    };
  }, [checkedInSiteId]);
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
