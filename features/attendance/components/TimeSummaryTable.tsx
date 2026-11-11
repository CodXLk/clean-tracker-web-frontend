"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Download } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useSites } from "@/features/user-management/hooks/useSites";
import {
  CLOSE_REASON_LABELS,
  TIME_TYPE_LABELS,
  formatMinutes,
  useTimeSummary,
  type TimeRow,
} from "@/features/attendance/hooks/useTimeSummary";
import { toLocalDateString } from "@/features/tasks/lib/task-utils";

function monthStart(): string {
  const d = new Date();
  return toLocalDateString(new Date(d.getFullYear(), d.getMonth(), 1));
}

function hours(minutes: number): string {
  return (minutes / 60).toFixed(2);
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCsv(rows: TimeRow[], from: string, to: string) {
  const header = [
    "Person", "Role", "Site", "Type", "PO", "Sessions", "Gross h", "Paused h", "Worked h",
    "General h", "Periodical h", "Late min", "Late sessions", "Close reasons", "First date", "Last date",
  ];
  const lines = rows.map((r) => [
    r.personName, r.personRole, r.siteName, TIME_TYPE_LABELS[r.type], r.poId ?? "", r.sessions,
    hours(r.grossMinutes), hours(r.pausedMinutes), hours(r.workedMinutes),
    r.type === "GENERAL" ? hours(r.generalMinutes) : "", r.type === "GENERAL" ? hours(r.periodicalMinutes) : "",
    r.lateMinutes, r.lateSessions,
    Object.entries(r.closeReasons).map(([k, n]) => `${CLOSE_REASON_LABELS[k] ?? k}: ${n}`).join("; "),
    r.firstDate ?? "", r.lastDate ?? "",
  ].map(csvCell).join(","));
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `time-summary_${from}_${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Worked time per person × site × type (General / Periodical / work order / supervision). */
export function TimeSummaryTable() {
  const [personId, setPersonId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(() => toLocalDateString(new Date()));
  const filters = useMemo(() => ({ siteId, from, to }), [siteId, from, to]);
  const summary = useTimeSummary(filters);
  const sitesQuery = useSites();
  const allRows = useMemo(() => summary.data?.rows ?? [], [summary.data]);
  const people = useMemo(() => {
    const byId = new Map<string, string>();
    for (const r of allRows) byId.set(r.personId, r.personName);
    return [...byId.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [allRows]);
  const rows = useMemo(
    () => (personId ? allRows.filter((r) => r.personId === personId) : allRows),
    [allRows, personId],
  );
  const totals = useMemo(() => {
    if (!summary.data) return null;
    const sum = (pick: (r: TimeRow) => number) => rows.reduce((acc, r) => acc + pick(r), 0);
    return {
      workedMinutes: sum((r) => r.workedMinutes),
      generalMinutes: sum((r) => r.generalMinutes),
      periodicalMinutes: sum((r) => r.periodicalMinutes),
      workOrderMinutes: sum((r) => (r.type === "WORK_ORDER" ? r.workedMinutes : 0)),
      supervisionMinutes: sum((r) => (r.type === "SUPERVISION" ? r.workedMinutes : 0)),
      pausedMinutes: sum((r) => r.pausedMinutes),
    };
  }, [rows, summary.data]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1 text-xs font-medium text-grey-600">
          Person
          <select
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            className="h-10 rounded-lg border border-grey-300 bg-white px-3 text-sm text-on-surface"
          >
            <option value="">Everyone</option>
            {people.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
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
        <div className="flex items-end">
          <button
            type="button"
            disabled={rows.length === 0}
            onClick={() => exportCsv(rows, summary.data?.from ?? from, summary.data?.to ?? to)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-grey-300 px-3 text-sm font-medium text-ink hover:bg-primary/5 disabled:cursor-not-allowed disabled:text-grey-400"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {totals && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Worked", totals.workedMinutes],
            ["General", totals.generalMinutes],
            ["Periodical", totals.periodicalMinutes],
            ["Work orders", totals.workOrderMinutes],
            ["Supervision", totals.supervisionMinutes],
            ["Paused", totals.pausedMinutes],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs text-grey-500">{label}</p>
              <p className="text-lg font-semibold text-on-surface">{formatMinutes(value as number)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {summary.isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : summary.isError ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-error">
            <AlertTriangle size={16} /> Failed to load the time summary.
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-grey-500">No time recorded for these filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="border-b border-grey-200 bg-grey-50 text-xs uppercase tracking-wide text-grey-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Person</th>
                  <th className="px-4 py-3 font-medium">Site</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Sessions</th>
                  <th className="px-4 py-3 font-medium">Gross</th>
                  <th className="px-4 py-3 font-medium">Paused</th>
                  <th className="px-4 py-3 font-medium">Worked</th>
                  <th className="px-4 py-3 font-medium">General / Periodical</th>
                  <th className="px-4 py-3 font-medium">Late</th>
                  <th className="px-4 py-3 font-medium">Close reasons</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-100">
                {rows.map((r) => (
                  <tr key={`${r.personId}-${r.siteId}-${r.type}-${r.workOrderId ?? r.poId ?? ""}`} className="hover:bg-grey-50">
                    <td className="px-4 py-3 font-medium text-on-surface">
                      {r.personName}
                      {r.personRole === "SUPERVISOR" && <span className="ml-1 text-[11px] text-grey-500">(supervisor)</span>}
                    </td>
                    <td className="px-4 py-3 text-grey-700">{r.siteName}</td>
                    <td className="px-4 py-3 text-grey-700">
                      {TIME_TYPE_LABELS[r.type]}
                      {r.poId ? ` · PO ${r.poId}` : ""}
                    </td>
                    <td className="px-4 py-3 text-grey-700">
                      {r.sessions}
                      {r.openSessions > 0 && <span className="ml-1 text-[11px] text-status-pending">({r.openSessions} open)</span>}
                    </td>
                    <td className="px-4 py-3 text-grey-700">{formatMinutes(r.grossMinutes)}</td>
                    <td className="px-4 py-3 text-grey-700">{formatMinutes(r.pausedMinutes)}</td>
                    <td className="px-4 py-3 font-semibold text-on-surface">{formatMinutes(r.workedMinutes)}</td>
                    <td className="px-4 py-3 text-grey-700">
                      {r.type === "GENERAL" ? `${formatMinutes(r.generalMinutes)} / ${formatMinutes(r.periodicalMinutes)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-grey-700">
                      {r.lateSessions > 0 ? `${r.lateMinutes}m (${r.lateSessions}×)` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-grey-600">
                      {Object.entries(r.closeReasons)
                        .map(([k, n]) => `${CLOSE_REASON_LABELS[k] ?? k}: ${n}`)
                        .join(", ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-grey-500">
        Worked time = gross minus paused. General vs Periodical is split by the planned durations of tasks completed in
        each session. Open sessions are counted up to now.
      </p>
    </div>
  );
}
