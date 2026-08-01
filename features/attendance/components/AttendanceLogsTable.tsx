"use client";

import { useMemo, useState } from "react";
import { MapPin, Nfc, LocateFixed, AlertTriangle } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useCleaners } from "@/features/cleaners/hooks/useCleaners";
import { useAttendanceLogs, type AttendanceLogFilters } from "@/features/attendance/hooks/useAttendance";
import { AttendanceMapModal } from "./AttendanceMapModal";
import type { AttendanceLog } from "@/features/attendance/schemas/attendance.schema";

function fmtDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

function fmtTime(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function fmtDistance(meters?: number | null): string {
  if (meters == null) return "—";
  return `${Math.round(meters)} m`;
}

function MethodBadge({ method }: { method?: string | null }) {
  if (!method) return <span className="text-grey-400">—</span>;
  const isNfc = method === "NFC";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        isNfc ? "bg-primary/10 text-primary" : "bg-grey-100 text-grey-700"
      }`}
    >
      {isNfc ? <Nfc size={12} /> : <MapPin size={12} />}
      {method}
    </span>
  );
}

export function AttendanceLogsTable() {
  const [cleanerId, setCleanerId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mapLog, setMapLog] = useState<AttendanceLog | null>(null);

  const filters: AttendanceLogFilters = useMemo(
    () => ({
      cleanerId: cleanerId || undefined,
      siteId: siteId || undefined,
      from: from || undefined,
      to: to || undefined,
    }),
    [cleanerId, siteId, from, to],
  );

  const logsQuery = useAttendanceLogs(filters);
  const sitesQuery = useSites();
  const cleanersQuery = useCleaners();

  const logs = logsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-grey-600">
          Cleaner
          <select
            value={cleanerId}
            onChange={(e) => setCleanerId(e.target.value)}
            className="h-10 rounded-lg border border-grey-300 bg-white px-3 text-sm text-on-surface"
          >
            <option value="">All cleaners</option>
            {(cleanersQuery.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {[c.firstName, c.lastName].filter(Boolean).join(" ") || c.email}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-grey-600">
          Site
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="h-10 rounded-lg border border-grey-300 bg-white px-3 text-sm text-on-surface"
          >
            <option value="">All sites</option>
            {(sitesQuery.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-grey-600">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-10 rounded-lg border border-grey-300 bg-white px-3 text-sm text-on-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-grey-600">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-10 rounded-lg border border-grey-300 bg-white px-3 text-sm text-on-surface"
          />
        </label>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {logsQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : logsQuery.isError ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-error">
            <AlertTriangle size={16} /> Failed to load attendance logs.
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-grey-500">No attendance records match these filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-grey-200 bg-grey-50 text-xs uppercase tracking-wide text-grey-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Cleaner</th>
                  <th className="px-4 py-3 font-medium">Site</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Check-in</th>
                  <th className="px-4 py-3 font-medium">Check-out</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Distance</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-100">
                {logs.map((log) => {
                  const hasCoords =
                    (log.checkInLatitude != null && log.checkInLongitude != null) ||
                    (log.siteLatitude != null && log.siteLongitude != null);
                  return (
                    <tr key={log.id} className="hover:bg-grey-50">
                      <td className="px-4 py-3 font-medium text-on-surface">{log.cleanerName ?? "—"}</td>
                      <td className="px-4 py-3 text-grey-700">{log.siteName}</td>
                      <td className="px-4 py-3 text-grey-700">{fmtDate(log.occurrenceDate)}</td>
                      <td className="px-4 py-3 text-grey-700">{fmtTime(log.checkInAt)}</td>
                      <td className="px-4 py-3 text-grey-700">{fmtTime(log.checkOutAt)}</td>
                      <td className="px-4 py-3">
                        <MethodBadge method={log.checkInMethod} />
                      </td>
                      <td className="px-4 py-3 text-grey-700">{fmtDistance(log.checkInDistanceMeters)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            log.status === "CHECKED_OUT"
                              ? "bg-success/10 text-success"
                              : "bg-status-pending/10 text-status-pending"
                          }`}
                        >
                          {log.status === "CHECKED_OUT" ? "Checked out" : "Checked in"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setMapLog(log)}
                          disabled={!hasCoords}
                          className="inline-flex items-center gap-1 rounded-lg border border-grey-300 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:text-grey-400"
                        >
                          <LocateFixed size={13} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AttendanceMapModal open={!!mapLog} onClose={() => setMapLog(null)} log={mapLog} />
    </div>
  );
}
