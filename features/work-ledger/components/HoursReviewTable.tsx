"use client";

import { Fragment, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useSites } from "@/features/user-management/hooks/useSites";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { CHECKED_OUT_BY_LABELS, CLOSE_REASON_LABELS, formatMinutes } from "@/features/attendance/hooks/useTimeSummary";
import { toLocalDateString } from "@/features/tasks/lib/task-utils";
import {
  PAUSE_REASON_LABELS,
  REVIEW_STATUS_LABELS,
  WORK_STATUS_LABELS,
  useWorkLedger,
  useWorkLedgerAction,
  type ReviewAction,
  type WorkEntry,
  type WorkSession,
} from "@/features/work-ledger/hooks/useWorkLedger";
import { cn } from "@/lib/utils/cn";

function daysAgo(n: number): string {
  const d = new Date();
  return toLocalDateString(new Date(d.getFullYear(), d.getMonth(), d.getDate() - n));
}

/** "8:05 PM" in the session's site time zone. */
function siteTime(iso: string | null | undefined, tz: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", ...(tz ? { timeZone: tz } : {}) });
}

/** How a session ended and who ended it, in words a reviewer can check against the times. */
function endedHow(s: WorkSession): string {
  if (!s.checkOutAt) return s.status === "PAUSED" ? "Still open (paused)" : "Still open";
  if (s.closeReason === "FORGOT_CHECKOUT") {
    const closed = s.closedAt && s.closedAt !== s.checkOutAt ? ` (closed it at ${siteTime(s.closedAt, s.timezone)})` : "";
    return `Forgot to check out — checked out by the system at the shift end${closed}`;
  }
  if (s.closeReason === "WORK_ORDER_COMPLETED") return "Checked out by the system (work order completed)";
  const reason = s.closeReason && s.closeReason !== "CHECKED_OUT" ? CLOSE_REASON_LABELS[s.closeReason] ?? s.closeReason : null;
  const by = s.checkedOutBy ? CHECKED_OUT_BY_LABELS[s.checkedOutBy] ?? s.checkedOutBy : null;
  const forced = s.status === "FORCED_CHECKOUT" ? "Forced check-out" : "Checked out";
  return [by ? `${forced} by ${by}` : forced, reason].filter(Boolean).join(" · ");
}

/** The sessions (and pauses) that make up a day's worked time. */
function SessionBreakdown({ entry }: { entry: WorkEntry }) {
  if (entry.sessions.length === 0) {
    return <p className="text-xs text-grey-500">No attendance sessions for this day.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {entry.sessions.map((s, i) => (
        <div key={s.id} className="rounded-lg border border-grey-200 bg-white p-3 text-xs text-grey-700">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-semibold text-on-surface">Session {i + 1}</span>
            {s.scheduledStartAt && s.scheduledEndAt && (
              <span>
                Shift {siteTime(s.scheduledStartAt, s.timezone)}–{siteTime(s.scheduledEndAt, s.timezone)}
              </span>
            )}
            <span>Checked in {siteTime(s.checkInAt, s.timezone)}</span>
            {s.lateMinutes != null && s.lateMinutes > 0 && <span className="text-amber-700">({s.lateMinutes} min late)</span>}
            <span>
              {s.checkOutAt ? `Out ${siteTime(s.checkOutAt, s.timezone)}` : "Not checked out"} · {endedHow(s)}
            </span>
          </div>
          {s.pauses.length > 0 && (
            <ul className="mt-1.5 flex flex-col gap-0.5">
              {s.pauses.map((p, j) => (
                <li key={j}>
                  Paused {siteTime(p.pausedAt, s.timezone)} →{" "}
                  {p.resumedAt
                    ? p.resumedAt === s.checkOutAt
                      ? `${siteTime(p.resumedAt, s.timezone)} (never resumed)`
                      : `resumed ${siteTime(p.resumedAt, s.timezone)}`
                    : "not resumed"}
                  {p.reason ? ` · ${PAUSE_REASON_LABELS[p.reason] ?? p.reason}` : ""}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-1.5 flex flex-wrap gap-x-4 font-medium">
            <span>On site {formatMinutes(s.grossMinutes)}</span>
            <span>Paused {formatMinutes(s.pausedMinutes)}</span>
            <span className="text-on-surface">Worked {formatMinutes(s.workedMinutes)}</span>
            {s.workedPercent != null && entry.minimumMinutes != null && (
              <span>{s.workedPercent}% of the {formatMinutes(entry.minimumMinutes)} minimum</span>
            )}
          </div>
          {(s.earlyCheckInMinutes || s.lateCheckOutMinutes || s.windowLeftMinutes != null) && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {!!s.earlyCheckInMinutes && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                  Checked in {formatMinutes(s.earlyCheckInMinutes)} before the shift
                </span>
              )}
              {!!s.lateCheckOutMinutes && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                  Checked out {formatMinutes(s.lateCheckOutMinutes)} after the shift
                </span>
              )}
              {s.windowLeftMinutes != null && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                  Checked in with only {formatMinutes(s.windowLeftMinutes)} of General time left
                </span>
              )}
            </div>
          )}
          {s.checkoutNote && <p className="mt-1.5 italic text-grey-600">Cleaner&apos;s note: &ldquo;{s.checkoutNote}&rdquo;</p>}
        </div>
      ))}
    </div>
  );
}

const REVIEW_TONE: Record<WorkEntry["reviewStatus"], string> = {
  SYSTEM: "bg-status-pending/10 text-status-pending",
  SUPERVISOR_REVIEWED: "bg-primary/10 text-ink",
  APPROVED: "bg-success/10 text-success",
  REOPENED: "bg-error/10 text-error",
};

/**
 * Daily work record: every person's day per site with worked, agreed and final hours. Supervisors
 * review their sites' rows; management approves the final hours used on invoices.
 */
export function HoursReviewTable() {
  const [siteId, setSiteId] = useState("");
  const [from, setFrom] = useState(() => daysAgo(7));
  const [to, setTo] = useState(() => daysAgo(1));
  const [refresh, setRefresh] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [toReviewOnly, setToReviewOnly] = useState(false);

  const filters = useMemo(() => ({ siteId: siteId || undefined, from, to }), [siteId, from, to]);
  const ledger = useWorkLedger(filters, refresh);
  const sitesQuery = useSites();
  const action = useWorkLedgerAction();
  const allRows = useMemo(() => ledger.data ?? [], [ledger.data]);
  const rows = useMemo(
    () => (toReviewOnly ? allRows.filter((r) => r.reviewStatus === "SYSTEM" || r.reviewStatus === "REOPENED") : allRows),
    [allRows, toReviewOnly],
  );

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const chosen = rows.filter((r) => selected.has(r.id));
  const canReviewAll = chosen.length > 0 && chosen.every((r) => r.canReview);
  const canApproveAll = chosen.length > 0 && chosen.every((r) => r.canApprove);
  const canReopenAll = chosen.length > 0 && chosen.every((r) => r.canApprove && r.reviewStatus === "APPROVED");

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function editedMinutes(r: WorkEntry): number | null {
    const raw = edits[r.id];
    if (raw == null || raw.trim() === "") return null;
    const hours = Number(raw);
    return Number.isFinite(hours) && hours >= 0 ? Math.round(hours * 60) : null;
  }

  async function run(kind: ReviewAction) {
    setError(null);
    if (kind === "review" || kind === "approve") {
      const bad = chosen.find((r) => edits[r.id]?.trim() && editedMinutes(r) == null);
      if (bad) {
        setError(`Enter a valid number of hours for ${bad.personName ?? "the selected row"}.`);
        return;
      }
    }
    try {
      await action.mutateAsync({
        action: kind,
        items: chosen.map((r) => ({ id: r.id, minutes: editedMinutes(r) })),
        note: note.trim() || undefined,
      });
      setSelected(new Set());
      setEdits({});
      setNote("");
      setRefresh(false);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  const totals = useMemo(
    () => ({
      worked: allRows.reduce((a, r) => a + r.workedMinutes, 0),
      final: allRows.reduce((a, r) => a + r.finalMinutes, 0),
      toReview: allRows.filter((r) => r.reviewStatus === "SYSTEM" || r.reviewStatus === "REOPENED").length,
      belowMinimum: allRows.filter((r) => r.belowMinimum).length,
      approved: allRows.filter((r) => r.reviewStatus === "APPROVED").length,
    }),
    [allRows],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-grey-600">
          Site
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="h-10 rounded-lg border border-grey-300 bg-white px-3 text-sm text-on-surface"
          >
            <option value="">All my sites</option>
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
            onClick={() => {
              setRefresh(true);
              void ledger.refetch();
            }}
            disabled={ledger.isFetching}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-grey-300 px-3 text-sm font-medium text-ink hover:bg-primary/5 disabled:opacity-60"
          >
            <RefreshCw size={15} className={cn(ledger.isFetching && "animate-spin")} /> Rebuild from attendance
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ["Worked", formatMinutes(totals.worked)],
          ["Final", formatMinutes(totals.final)],
          ["To review", String(totals.toReview)],
          ["Below minimum", String(totals.belowMinimum)],
          ["Approved", String(totals.approved)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-grey-500">{label}</p>
            <p className="text-lg font-semibold text-on-surface">{value}</p>
          </div>
        ))}
      </div>

      <label className="flex items-center gap-2 self-start text-sm text-grey-700">
        <input type="checkbox" checked={toReviewOnly} onChange={(e) => setToReviewOnly(e.target.checked)} />
        Show only days waiting for a supervisor
      </label>

      {chosen.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
          <span className="text-sm text-grey-700">{chosen.length} selected</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            placeholder="Note (optional)"
            className="h-9 min-w-[200px] flex-1 rounded-lg border border-grey-300 px-3 text-sm"
          />
          {canReviewAll && (
            <button
              type="button"
              disabled={action.isPending}
              onClick={() => run("review")}
              className="rounded-full border border-primary px-4 py-1.5 text-sm font-semibold text-ink hover:bg-primary/5 disabled:opacity-50"
            >
              Mark reviewed
            </button>
          )}
          {canApproveAll && (
            <button
              type="button"
              disabled={action.isPending}
              onClick={() => run("approve")}
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Approve
            </button>
          )}
          {canReopenAll && (
            <button
              type="button"
              disabled={action.isPending}
              onClick={() => run("reopen")}
              className="rounded-full border border-grey-300 px-4 py-1.5 text-sm font-semibold text-error hover:bg-grey-50 disabled:opacity-50"
            >
              Reopen
            </button>
          )}
        </div>
      )}
      {error && <p className="text-sm text-error">{error}</p>}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {ledger.isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : ledger.isError ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-error">
            <AlertTriangle size={16} /> {getErrorMessage(ledger.error)}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-grey-500">
            {toReviewOnly && allRows.length > 0 ? "Nothing waiting for review." : "No work recorded for these dates."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left text-sm">
              <thead className="border-b border-grey-200 bg-grey-50 text-xs uppercase tracking-wide text-grey-500">
                <tr>
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={rows.length > 0 && rows.every((r) => selected.has(r.id))}
                      onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())}
                    />
                  </th>
                  <th className="px-1 py-3" aria-label="Sessions" />
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Person</th>
                  <th className="px-3 py-3 font-medium">Site</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Worked</th>
                  <th className="px-3 py-3 font-medium">Of minimum</th>
                  <th className="px-3 py-3 font-medium">Agreed</th>
                  <th className="px-3 py-3 font-medium">System</th>
                  <th className="px-3 py-3 font-medium">Supervisor</th>
                  <th className="px-3 py-3 font-medium">Final</th>
                  <th className="px-3 py-3 font-medium">Adjust (h)</th>
                  <th className="px-3 py-3 font-medium">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-100">
                {rows.map((r) => {
                  const editable = r.canReview || r.canApprove;
                  const open = expanded.has(r.id);
                  return (
                    <Fragment key={r.id}>
                    <tr className={cn("hover:bg-grey-50", selected.has(r.id) && "bg-primary/5")}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          aria-label={`Select ${r.personName ?? ""} ${r.workDate}`}
                          disabled={!editable}
                          checked={selected.has(r.id)}
                          onChange={() => toggle(r.id)}
                        />
                      </td>
                      <td className="px-1 py-2">
                        {r.sessionCount > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(r.id)}
                            aria-expanded={open}
                            aria-label={open ? "Hide sessions" : "Show sessions"}
                            className="rounded p-1 text-grey-500 hover:bg-grey-100"
                          >
                            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-2 text-grey-700">{r.workDate}</td>
                      <td className="px-3 py-2 font-medium text-on-surface">
                        {r.personName}
                        {r.context === "SUPERVISION" && <span className="ml-1 text-[11px] text-grey-500">(supervision)</span>}
                      </td>
                      <td className="px-3 py-2 text-grey-700">{r.siteName}</td>
                      <td className="px-3 py-2 text-grey-700">
                        {WORK_STATUS_LABELS[r.status]}
                        {r.coveredName && <span className="block text-[11px] text-grey-500">for {r.coveredName}</span>}
                        {r.coveredByName && <span className="block text-[11px] text-grey-500">by {r.coveredByName}</span>}
                      </td>
                      <td className="px-3 py-2 text-grey-700">
                        {formatMinutes(r.workedMinutes)}
                        {r.pausedMinutes > 0 && (
                          <span className="block text-[11px] text-grey-500">paused {formatMinutes(r.pausedMinutes)}</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {r.workedPercent != null && r.minimumMinutes != null ? (
                          <>
                            <span className={cn("font-semibold", r.belowMinimum ? "text-error" : "text-success")}>
                              {r.workedPercent}%
                            </span>
                            <span className="block text-[11px] text-grey-500">
                              of {formatMinutes(r.minimumMinutes)}
                              {r.minimumMandatory ? " (mandatory)" : ""} · needs {r.thresholdPercent}%
                            </span>
                            {r.belowMinimum && (
                              <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-error/10 px-1.5 py-0.5 text-[10px] font-semibold text-error">
                                <AlertTriangle size={10} /> Below minimum
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-grey-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-grey-700">{r.agreedMinutes != null ? formatMinutes(r.agreedMinutes) : "—"}</td>
                      <td className="px-3 py-2 text-grey-700">{formatMinutes(r.systemMinutes)}</td>
                      <td className="px-3 py-2 text-grey-700">
                        {r.supervisorMinutes != null ? formatMinutes(r.supervisorMinutes) : "—"}
                      </td>
                      <td className="px-3 py-2 font-semibold text-on-surface">{formatMinutes(r.finalMinutes)}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          max={24}
                          step={0.25}
                          disabled={!editable}
                          value={edits[r.id] ?? ""}
                          placeholder={(r.finalMinutes / 60).toFixed(2)}
                          onChange={(e) => {
                            setEdits((p) => ({ ...p, [r.id]: e.target.value }));
                            if (!selected.has(r.id)) toggle(r.id);
                          }}
                          className="h-8 w-20 rounded-lg border border-grey-300 px-2 text-sm disabled:bg-grey-50"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", REVIEW_TONE[r.reviewStatus])}>
                          {r.autoReviewed ? "Reviewed (system)" : REVIEW_STATUS_LABELS[r.reviewStatus]}
                        </span>
                        {r.sourceChanged && <span className="block text-[11px] text-error">Data changed</span>}
                        {r.invoiceId && <span className="block text-[11px] text-grey-500">Invoiced</span>}
                      </td>
                    </tr>
                    {open && (
                      <tr className="bg-grey-50">
                        <td colSpan={14} className="px-6 py-3">
                          <SessionBreakdown entry={r} />
                          {r.supervisorNote && (
                            <p className="mt-2 text-xs text-grey-600">Review note: {r.supervisorNote}</p>
                          )}
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-grey-500">
        Worked time is the actual time between check-in and check-out, minus paused time. Each day is compared with
        the site&apos;s minimum working period: days that reach it (80%, or 100% when mandatory) are reviewed by the
        system; days below it wait for the site supervisor. System hours are worked time capped at the agreed hours.
        Management approves the final hours used on invoices. Nobody can review or approve their own hours.
      </p>
    </div>
  );
}
