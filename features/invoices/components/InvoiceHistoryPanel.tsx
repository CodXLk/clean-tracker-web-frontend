"use client";

import { Fragment, useMemo, useState } from "react";
import { History } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import {
  ACTION_LABELS,
  SECTION_LABELS,
  STATUS_LABELS,
  formatMoney,
  hoursText,
  useInvoiceHistory,
  type InvoiceEvent,
  type InvoiceSection,
  type InvoiceSnapshot,
  type InvoiceStatus,
  type SnapshotLine,
} from "@/features/invoices/hooks/useInvoices";
import { dateTimeText, dayText } from "@/features/invoices/lib/format";
import { cn } from "@/lib/utils/cn";

function statusText(s?: string | null) {
  return s ? (STATUS_LABELS[s as InvoiceStatus] ?? s) : "";
}

function actor(e: InvoiceEvent) {
  const name = [e.actorFirstName, e.actorLastName].filter(Boolean).join(" ") || "System";
  return e.actorRole ? `${name} (${e.actorRole.replaceAll("_", " ").toLowerCase()})` : name;
}

/** Every status change and edit of an invoice; each snapshot (version) can be opened and compared to the previous one. */
export function InvoiceHistoryPanel({ id }: { id: string }) {
  const { data: events = [], isLoading, error } = useInvoiceHistory(id);
  const [open, setOpen] = useState<string | null>(null);

  // The snapshot before each snapshot event, to highlight what changed between versions.
  const previous = useMemo(() => {
    const out = new Map<string, InvoiceSnapshot | null>();
    let last: InvoiceSnapshot | null = null;
    for (const e of events) {
      if (e.snapshot) {
        out.set(e.id, last);
        last = e.snapshot;
      }
    }
    return out;
  }, [events]);

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-on-surface">
        <History size={16} /> History &amp; versions
      </h3>
      {isLoading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <p className="text-sm text-error">{getErrorMessage(error)}</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-grey-500">No history yet.</p>
      ) : (
        <ol className="relative flex flex-col gap-3 border-l border-grey-200 pl-4">
          {[...events].reverse().map((e) => (
            <li key={e.id} className="relative">
              <span className={cn("absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full",
                e.snapshot ? "bg-primary" : "bg-grey-300")} />
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-semibold text-on-surface">{ACTION_LABELS[e.action] ?? e.action}</span>
                {e.version != null && e.version > 0 && <span className="text-xs text-grey-500">v{e.version}</span>}
                {e.fromStatus && e.toStatus && e.fromStatus !== e.toStatus && (
                  <span className="text-xs text-grey-500">{statusText(e.fromStatus)} → {statusText(e.toStatus)}</span>
                )}
                {e.totalAmount != null && <span className="text-xs text-grey-500">· total {formatMoney(e.totalAmount)}</span>}
              </div>
              <p className="text-xs text-grey-600">{actor(e)} · {dateTimeText(e.createdAt)}</p>
              {e.comment && <p className="mt-1 rounded-lg bg-grey-50 px-2 py-1 text-sm text-grey-800">“{e.comment}”</p>}
              {e.details.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-xs text-grey-700">
                  {e.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
              {e.snapshot && (
                <button type="button" onClick={() => setOpen(open === e.id ? null : e.id)}
                  className="mt-1 text-xs font-medium text-primary hover:underline">
                  {open === e.id ? "Hide this version" : "View this version"}
                </button>
              )}
              {open === e.id && e.snapshot && <SnapshotTable snapshot={e.snapshot} previous={previous.get(e.id) ?? null} />}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function SnapshotTable({ snapshot, previous }: { snapshot: InvoiceSnapshot; previous: InvoiceSnapshot | null }) {
  const before = new Map((previous?.lines ?? []).map((l) => [l.key, l]));
  const removed = previous ? previous.lines.filter((l) => !snapshot.lines.some((n) => n.key === l.key)) : [];
  const roles = [...new Set(snapshot.lines.map((l) => l.role))];
  const changed = (l: SnapshotLine, field: keyof SnapshotLine) => {
    if (!previous) return false;
    const old = before.get(l.key);
    return !old || old[field] !== l[field];
  };
  const cell = (on: boolean) => cn("px-2 py-1 text-right", on && "bg-status-pending/15 font-semibold");

  return (
    <div className="mt-2 overflow-x-auto rounded-xl border border-grey-200">
      <p className="border-b border-grey-100 px-3 py-2 text-xs text-grey-600">
        {snapshot.number} · {statusText(snapshot.status)} · {dayText(snapshot.periodFrom)} → {dayText(snapshot.periodTo)} · total{" "}
        <strong>{formatMoney(snapshot.totalAmount)}</strong>
        {previous && previous.totalAmount !== snapshot.totalAmount && (
          <> (previous version {formatMoney(previous.totalAmount)})</>
        )}
        {previous && <span className="ml-1 text-grey-500">· highlighted cells changed since the previous version</span>}
      </p>
      <table className="w-full min-w-[900px] text-left text-xs">
        <thead className="bg-grey-50 uppercase text-grey-500">
          <tr>
            <th className="px-2 py-1">Date</th>
            <th className="px-2 py-1">Line</th>
            <th className="px-2 py-1 text-right">Actual h</th>
            <th className="px-2 py-1 text-right">Agreed h</th>
            <th className="px-2 py-1 text-right">Person entered</th>
            <th className="px-2 py-1 text-right">Mgmt set</th>
            <th className="px-2 py-1 text-right">Final h</th>
            <th className="px-2 py-1 text-right">Rate</th>
            <th className="px-2 py-1 text-right">×</th>
            <th className="px-2 py-1 text-right">Amount</th>
            <th className="px-2 py-1">State</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <Fragment key={role}>
              {roles.length > 1 && (
                <tr className="bg-grey-50/60">
                  <td colSpan={11} className="px-2 py-1 font-semibold uppercase text-grey-600">{role === "CLEANER" ? "Cleaner" : "Supervisor"}</td>
                </tr>
              )}
              {snapshot.lines.filter((l) => l.role === role).map((l) => (
                <tr key={l.key} className={cn("border-t border-grey-100", previous && !before.has(l.key) && "bg-success/5")}>
                  <td className="whitespace-nowrap px-2 py-1">{dayText(l.date)}</td>
                  <td className="px-2 py-1">
                    {SECTION_LABELS[l.section as InvoiceSection] ?? l.section}
                    {l.poId ? ` · PO ${l.poId}` : l.siteName ? ` · ${l.siteName}` : ""}
                    {l.note && <span className="block text-grey-500">Note: {l.note}</span>}
                    {l.items && <span className="block text-grey-500">{l.items.split("\n").map((r) => r.split(" | ").join(" · ")).join("; ")}</span>}
                    {l.adminNote && <span className="block text-grey-500">Mgmt: {l.adminNote}</span>}
                  </td>
                  <td className="px-2 py-1 text-right">{hoursText(l.actualMinutes)}</td>
                  <td className="px-2 py-1 text-right">{hoursText(l.agreedMinutes)}</td>
                  <td className={cell(changed(l, "claimedMinutes"))}>
                    {l.rateType === "TOTAL" ? formatMoney(l.claimedAmount) : hoursText(l.claimedMinutes)}
                  </td>
                  <td className={cell(changed(l, "approvedMinutes") || changed(l, "approvedAmount"))}>
                    {l.rateType === "TOTAL" ? formatMoney(l.approvedAmount) : hoursText(l.approvedMinutes)}
                  </td>
                  <td className={cell(changed(l, "finalMinutes"))}>{l.rateType === "TOTAL" ? "—" : hoursText(l.finalMinutes)}</td>
                  <td className={cell(changed(l, "rate"))}>{formatMoney(l.rate)}</td>
                  <td className="px-2 py-1 text-right">{l.multiplier ?? 1}</td>
                  <td className={cell(changed(l, "amount"))}>{formatMoney(l.amount)}</td>
                  <td className="px-2 py-1 text-grey-600">
                    {l.problem ? "Setup missing" : l.needsReview ? "Awaiting review" : l.locked ? "Finalised" : "Open"}
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
          {removed.map((l) => (
            <tr key={`removed-${l.key}`} className="border-t border-grey-100 bg-error/5 text-grey-500 line-through">
              <td className="px-2 py-1">{dayText(l.date)}</td>
              <td className="px-2 py-1" colSpan={8}>{SECTION_LABELS[l.section as InvoiceSection] ?? l.section} {l.siteName ?? ""}</td>
              <td className="px-2 py-1 text-right">{formatMoney(l.amount)}</td>
              <td className="px-2 py-1">Removed</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
