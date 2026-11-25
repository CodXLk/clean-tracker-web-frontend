"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useCleaners } from "@/features/cleaners/hooks/useCleaners";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { toLocalDateString } from "@/features/tasks/lib/task-utils";
import { formatMove, useShiftLog, type ShiftLogEntry } from "@/features/shifts/hooks/useShiftSchedule";
import { cn } from "@/lib/utils/cn";
import { DateInput } from "@/components/shared/DateInput";
import { formatDate, formatDateTime } from "@/lib/utils/format";

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  APPROVED: "Approved",
  PENDING: "Waiting for approval",
  REJECTED: "Declined",
  CANCELLED: "Cancelled",
};

const STATUS_TONE: Record<string, string> = {
  APPLIED: "bg-success/10 text-success",
  APPROVED: "bg-success/10 text-success",
  PENDING: "bg-status-pending/10 text-status-pending",
  REJECTED: "bg-error/10 text-error",
  CANCELLED: "bg-grey-100 text-grey-600",
};

const SOURCE_LABELS: Record<string, string> = {
  REMINDER: "From reminder",
  MANUAL: "Manual",
};

function hhmm(t: string): string {
  return t.slice(0, 5);
}

function fmtDate(value: string): string {
  return `${formatDate(value, { weekday: "short" })} ${formatDate(value)}`;
}

/** Overnight shifts end the next day; a move can also push a time over midnight. */
function range(start: string, end: string): string {
  return `${hhmm(start)}–${hhmm(end)}${end <= start ? " (+1)" : ""}`;
}

function daysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
}

/** Day-by-day history of one-day shift moves: what the shift was, what it was moved to, and who decided. */
export function ShiftLogView({ onBack }: { onBack: () => void }) {
  const [siteId, setSiteId] = useState("");
  const [cleanerId, setCleanerId] = useState("");
  const [from, setFrom] = useState(() => daysFromToday(-30));
  const [to, setTo] = useState(() => daysFromToday(30));

  const filters = useMemo(
    () => ({ siteId: siteId || undefined, cleanerId: cleanerId || undefined, from: from || undefined, to: to || undefined }),
    [siteId, cleanerId, from, to],
  );
  const log = useShiftLog(filters);
  const sitesQuery = useSites();
  const cleanersQuery = useCleaners();
  const rows: ShiftLogEntry[] = useMemo(() => log.data ?? [], [log.data]);

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

  const totals = useMemo(
    () => ({
      moves: rows.length,
      inForce: rows.filter((r) => r.inForce).length,
      pending: rows.filter((r) => r.status === "PENDING").length,
      declined: rows.filter((r) => r.status === "REJECTED").length,
    }),
    [rows],
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-on-surface">Shift log</h2>
          <p className="text-xs text-grey-500">
            Every one-day shift move by day — the original shift, what it was moved to, and who requested and decided it.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full border border-grey-300 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-grey-50"
        >
          <ArrowLeft size={14} /> Back to shift requests
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
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
          From
          <DateInput
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-10 rounded-lg border border-grey-300 bg-white px-3 text-sm text-on-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-grey-600">
          To
          <DateInput
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-10 rounded-lg border border-grey-300 bg-white px-3 text-sm text-on-surface"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Moves", totals.moves],
          ["In force", totals.inForce],
          ["Waiting", totals.pending],
          ["Declined", totals.declined],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-grey-500">{label}</p>
            <p className="text-lg font-semibold text-on-surface">{value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {log.isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : log.isError ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-error">
            <AlertTriangle size={16} /> {getErrorMessage(log.error)}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-grey-500">No shift moves for these filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left text-sm">
              <thead className="border-b border-grey-200 bg-grey-50 text-xs uppercase tracking-wide text-grey-500">
                <tr>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Cleaner</th>
                  <th className="px-3 py-3 font-medium">Site</th>
                  <th className="px-3 py-3 font-medium">Original shift</th>
                  <th className="px-3 py-3 font-medium">Moved to</th>
                  <th className="px-3 py-3 font-medium">Move</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Requested</th>
                  <th className="px-3 py-3 font-medium">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-100">
                {rows.map((r) => (
                  <tr key={r.id} className="align-top hover:bg-grey-50">
                    <td className="px-3 py-2.5 text-grey-700">
                      {fmtDate(r.date)}
                      {r.timezone && <span className="block text-[11px] text-grey-400">{r.timezone}</span>}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-on-surface">{r.cleanerName || "Cleaner"}</td>
                    <td className="px-3 py-2.5 text-grey-700">{r.siteName}</td>
                    <td className={cn("px-3 py-2.5", r.inForce ? "text-grey-500 line-through" : "text-grey-700")}>
                      {range(r.originalStart, r.originalEnd)}
                    </td>
                    <td className={cn("px-3 py-2.5", r.inForce ? "font-medium text-on-surface" : "text-grey-500")}>
                      {range(r.movedStart, r.movedEnd)}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-on-surface">{formatMove(r.moveMinutes)}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                          STATUS_TONE[r.status] ?? "bg-grey-100 text-grey-600",
                        )}
                      >
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-grey-700">
                      {r.requestedByName || "—"}
                      {r.requestedAt && <span className="block text-[11px] text-grey-500">{formatDateTime(r.requestedAt)}</span>}
                      {r.source && <span className="block text-[11px] text-grey-500">{SOURCE_LABELS[r.source] ?? r.source}</span>}
                      {r.note && (
                        <span className="block max-w-[220px] text-[11px] italic text-grey-600" title={r.note}>
                          &ldquo;{r.note}&rdquo;
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-grey-700">
                      {r.reviewedByName || r.reviewedAt ? (
                        <>
                          {r.reviewedByName || "—"}
                          {r.reviewedAt && <span className="block text-[11px] text-grey-500">{formatDateTime(r.reviewedAt)}</span>}
                        </>
                      ) : r.status === "APPLIED" ? (
                        <span className="text-grey-500">No approval needed</span>
                      ) : (
                        <span className="text-grey-400">—</span>
                      )}
                      {r.reviewNote && (
                        <span className="block max-w-[220px] text-[11px] italic text-grey-600" title={r.reviewNote}>
                          &ldquo;{r.reviewNote}&rdquo;
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
