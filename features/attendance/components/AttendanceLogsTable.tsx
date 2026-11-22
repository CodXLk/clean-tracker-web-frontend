"use client";

import { useMemo, useState } from "react";
import { MapPin, Nfc, LocateFixed, AlertTriangle } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useCleaners } from "@/features/cleaners/hooks/useCleaners";
import { useAttendanceLogs, type AttendanceLogFilters } from "@/features/attendance/hooks/useAttendance";
import { AttendanceMapModal } from "./AttendanceMapModal";
import type { AttendanceLog } from "@/features/attendance/schemas/attendance.schema";
import { CHECKED_OUT_BY_LABELS, CLOSE_REASON_LABELS, formatMinutes } from "@/features/attendance/hooks/useTimeSummary";
import { PAUSE_REASON_LABELS } from "@/features/work-ledger/hooks/useWorkLedger";

function fmtDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

function fmtTime(iso?: string | null, timeZone?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  });
}

function fmtDistance(meters?: number | null): string {
  if (meters == null) return "—";
  return `${Math.round(meters)} m`;
}

const RESUMED_BY_LABELS: Record<string, string> = {
  CLEANER: "restarted by cleaner (slide to start)",
  AUTO: "restarted automatically — back on site",
  SESSION_END: "not restarted — session ended",
};

/** Every pause in the session: when and why it paused, and when and how it started again. */
function PauseList({ log }: { log: AttendanceLog }) {
  if (log.pauses.length === 0 && !log.pauseRecheckAt) return null;
  return (
    <ol className="mt-1 flex min-w-[230px] flex-col gap-1 text-[11px]">
      {log.pauses.map((p, i) => (
        <li key={`${p.pausedAt}-${i}`} className="rounded-md bg-grey-50 px-2 py-1">
          <span className="block font-medium text-[#ED5F25]">
            ⏸ {fmtTime(p.pausedAt, log.timezone)} · {PAUSE_REASON_LABELS[p.reason ?? ""] ?? p.reason ?? "Paused"}
            {p.distanceMeters != null ? ` (${Math.round(p.distanceMeters)} m away)` : ""}
          </span>
          {p.resumedAt ? (
            <span className={`block ${p.resumedBy === "SESSION_END" ? "text-grey-500" : "text-success"}`}>
              {p.resumedBy === "SESSION_END" ? "■" : "▶"} {fmtTime(p.resumedAt, log.timezone)} ·{" "}
              {RESUMED_BY_LABELS[p.resumedBy ?? ""] ?? "restarted"}
              {p.resumedBy === "AUTO" && p.resumeDistanceMeters != null
                ? ` (${Math.round(p.resumeDistanceMeters)} m)`
                : ""}
            </span>
          ) : (
            <span className="block text-grey-500">
              Still paused
              {log.pauseRecheckAt && i === log.pauses.length - 1
                ? ` · location check at ${fmtTime(log.pauseRecheckAt, log.timezone)}`
                : " · no more location checks"}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function MethodBadge({ method }: { method?: string | null }) {
  if (!method) return <span className="text-grey-400">—</span>;
  const isNfc = method === "NFC";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        isNfc ? "bg-primary/10 text-ink" : "bg-grey-100 text-grey-700"
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
  const cleanerOptions = useMemo(() => {
    if (siteId) {
      const site = (sitesQuery.data ?? []).find((s) => s.id === siteId);
      const byId = new Map<string, string>();
      for (const p of site?.cleanerProfiles ?? []) if (p.cleanerId) byId.set(p.cleanerId, p.cleanerName || p.label);
      return [...byId.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
    }
    return (cleanersQuery.data ?? []).map((c) => ({
      id: c.id,
      name: [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email || "Cleaner",
    }));
  }, [siteId, sitesQuery.data, cleanersQuery.data]);

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
            {cleanerOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-grey-600">
          Site
          <select
            value={siteId}
            onChange={(e) => {
              setSiteId(e.target.value);
              setCleanerId("");
            }}
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
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-grey-200 bg-grey-50 text-xs uppercase tracking-wide text-grey-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Cleaner</th>
                  <th className="px-4 py-3 font-medium">Site</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Check-in</th>
                  <th className="px-4 py-3 font-medium">Check-out</th>
                  <th className="px-4 py-3 font-medium">Worked</th>
                  <th className="px-4 py-3 font-medium">Pauses</th>
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
                      <td className="px-4 py-3 text-grey-700">
                        {log.sessionType === "WORK_ORDER" ? `PO ${log.poId ?? ""}` : log.sessionType ? "General" : "—"}
                      </td>
                      <td className="px-4 py-3 text-grey-700">
                        {fmtTime(log.checkInAt, log.timezone)}
                        {log.lateMinutes ? <span className="ml-1 text-[11px] text-error">+{log.lateMinutes}m late</span> : null}
                        {log.earlyCheckInMinutes ? (
                          <span className="block text-[11px] font-medium text-amber-700">
                            {formatMinutes(log.earlyCheckInMinutes)} before shift
                          </span>
                        ) : null}
                        {log.windowLeftMinutes != null ? (
                          <span className="block text-[11px] font-medium text-amber-700">
                            only {formatMinutes(log.windowLeftMinutes)} of General time left
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-grey-700">
                        {fmtTime(log.checkOutAt, log.timezone)}
                        {log.lateCheckOutMinutes ? (
                          <span className="block text-[11px] font-medium text-amber-700">
                            {formatMinutes(log.lateCheckOutMinutes)} after shift
                          </span>
                        ) : null}
                        {log.checkedOutBy && (
                          <span
                            className={`block text-[11px] ${log.checkedOutBy === "SYSTEM" ? "font-medium text-amber-700" : "text-grey-500"}`}
                          >
                            by {CHECKED_OUT_BY_LABELS[log.checkedOutBy] ?? log.checkedOutBy}
                            {log.checkedOutBy === "SYSTEM" && log.closedAt && log.closedAt !== log.checkOutAt
                              ? ` (closed ${fmtTime(log.closedAt, log.timezone)})`
                              : ""}
                          </span>
                        )}
                        {log.closeReason && log.closeReason !== "CHECKED_OUT" ? (
                          <span className="block text-[11px] text-grey-500">
                            {CLOSE_REASON_LABELS[log.closeReason] ?? log.closeReason}
                          </span>
                        ) : null}
                        {log.checkoutNote && (
                          <span className="block max-w-[220px] text-[11px] italic text-grey-600" title={log.checkoutNote}>
                            &ldquo;{log.checkoutNote}&rdquo;
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-on-surface">
                        {log.workedMinutes != null ? formatMinutes(log.workedMinutes) : "—"}
                        {log.workedPercent != null && log.minimumWorkMinutes != null && (
                          <span
                            className={`block text-[11px] font-normal ${log.belowThreshold ? "text-error" : "text-grey-500"}`}
                            title={`Needs ${log.thresholdPercent}% of the ${log.minimumWorkMinutes}-minute minimum${
                              log.minimumWorkMandatory ? " (mandatory)" : ""
                            }`}
                          >
                            {log.workedPercent}% of {formatMinutes(log.minimumWorkMinutes)}
                            {log.belowThreshold ? " · below minimum" : ""}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-grey-700">
                        {log.pausedMinutes ? formatMinutes(log.pausedMinutes) : log.pauses.length ? "0m" : "—"}
                        <PauseList log={log} />
                      </td>
                      <td className="px-4 py-3">
                        <MethodBadge method={log.checkInMethod} />
                      </td>
                      <td className="px-4 py-3 text-grey-700">{fmtDistance(log.checkInDistanceMeters)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            log.status === "CHECKED_OUT"
                              ? "bg-success/10 text-success"
                              : log.status === "FORCED_CHECKOUT"
                                ? "bg-error/10 text-error"
                                : "bg-status-pending/10 text-status-pending"
                          }`}
                        >
                          {log.status === "CHECKED_OUT"
                            ? "Checked out"
                            : log.status === "FORCED_CHECKOUT"
                              ? "Force checked out"
                              : log.status === "PAUSED"
                                ? "Paused"
                                : "Checked in"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setMapLog(log)}
                          disabled={!hasCoords}
                          className="inline-flex items-center gap-1 rounded-lg border border-grey-300 px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:text-grey-400"
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

      <AttendanceMapModal key={mapLog?.id ?? "none"} open={!!mapLog} onClose={() => setMapLog(null)} log={mapLog} />
    </div>
  );
}
