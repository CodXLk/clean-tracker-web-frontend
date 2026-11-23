"use client";

import { Fragment, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Download, FileText, Lock, RefreshCw } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import {
  SECTION_LABELS,
  STATUS_LABELS,
  STATUS_TONE,
  formatMoney,
  hoursText,
  useChangeInvoicePeriod,
  useEditInvoiceLine,
  useEditInvoiceLines,
  useInvoice,
  useInvoiceAction,
  useInvoicePart,
  useSaveInvoiceNotes,
  type Invoice,
  type InvoiceLine,
  type InvoicePart,
  type InvoiceSection,
} from "@/features/invoices/hooks/useInvoices";
import { InvoiceHistoryPanel } from "@/features/invoices/components/InvoiceHistoryPanel";
import { dateTimeText, dayText } from "@/features/invoices/lib/format";
import { cn } from "@/lib/utils/cn";

const input = "h-9 rounded-lg border border-grey-300 bg-white px-2.5 text-sm text-on-surface";
const button = "rounded-full px-4 py-1.5 text-sm font-semibold disabled:opacity-50";

/** Section → site → dated lines (the server already orders lines by section, site and date). */
function groupLines(lines: InvoiceLine[]) {
  const sections: { section: InvoiceSection; total: number; sites: { site: string; lines: InvoiceLine[] }[] }[] = [];
  for (const l of lines) {
    let s = sections.find((x) => x.section === l.section);
    if (!s) {
      s = { section: l.section, total: 0, sites: [] };
      sections.push(s);
    }
    s.total += l.amount ?? 0;
    const site = l.siteName ?? "—";
    let g = s.sites.find((x) => x.site === site);
    if (!g) {
      g = { site, lines: [] };
      s.sites.push(g);
    }
    g.lines.push(l);
  }
  return sections;
}

/** Descriptions that only repeat the section title are hidden to keep rows short. */
const REDUNDANT_DESCRIPTIONS = new Set(["General cleaning", "Supervision / inspection", "Supervision cover"]);

function rateSummary(lines: InvoiceLine[]) {
  const priced = lines.filter((l) => l.rateType !== "TOTAL");
  if (priced.length === 0) return null;
  const rates = new Set(priced.map((l) => `${l.finalRate ?? "none"}|${l.rateType}`));
  if (rates.size > 1) return "rates vary by day";
  const l = priced[0]!;
  if (l.finalRate == null) return "no rate set";
  return `${formatMoney(l.finalRate)}${l.rateType === "PER_VISIT" ? " per visit" : "/h"}`;
}
/**
 * One invoice. The server decides what the viewer may do (`inv.can`): the person edits final hours on open lines
 * and completes each role part; management edits while pending, approves, returns or reopens, and sees the history.
 */
export function InvoiceEditor({ id, onBack, backLabel = "All invoices" }: { id: string; onBack: () => void; backLabel?: string }) {
  const { data: inv, isLoading, error: loadError } = useInvoice(id);
  const [partIndex, setPartIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }
  if (!inv) return <p className="text-sm text-error">{getErrorMessage(loadError)}</p>;

  const parts = inv.parts.length > 0 ? inv.parts : [];
  const index = Math.min(partIndex, Math.max(0, parts.length - 1));
  const part = parts[index];

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="inline-flex w-fit items-center gap-1 text-sm text-grey-600 hover:text-ink">
        <ArrowLeft size={16} /> {backLabel}
      </button>
      <InvoiceHeader inv={inv} onError={setError} onDeleted={onBack} />
      {error && <p className="text-sm text-error">{error}</p>}
      <StatusBanner inv={inv} />

      {parts.length === 0 ? (
        <p className="rounded-2xl bg-white py-12 text-center text-sm text-grey-500 shadow-sm">No hours found for this period.</p>
      ) : (
        <>
          {parts.length > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white p-3 shadow-sm">
              <button type="button" disabled={index === 0} onClick={() => setPartIndex(index - 1)}
                className={`${button} inline-flex items-center gap-1 border border-grey-300 text-ink hover:bg-grey-50`}>
                <ChevronLeft size={16} /> Previous
              </button>
              <div className="flex gap-2" role="tablist">
                {parts.map((p, i) => (
                  <button key={p.role} type="button" role="tab" aria-selected={i === index} onClick={() => setPartIndex(i)}
                    className={cn("inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium",
                      i === index ? "bg-primary text-white" : "bg-grey-100 text-grey-700 hover:bg-grey-200")}>
                    {p.completed && <CheckCircle2 size={14} />} {p.label} ({i + 1}/{parts.length})
                  </button>
                ))}
              </div>
              <button type="button" disabled={index === parts.length - 1} onClick={() => setPartIndex(index + 1)}
                className={`${button} inline-flex items-center gap-1 border border-grey-300 text-ink hover:bg-grey-50`}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
          {part && (
            <PartSection key={part.role} inv={inv} part={part} isLast={parts.every((p) => p.role === part.role || p.completed)}
              onError={setError} onNext={index < parts.length - 1 ? () => setPartIndex(index + 1) : undefined} />
          )}
        </>
      )}

      <NotesCard inv={inv} onError={setError} />
      {inv.can.viewHistory && <InvoiceHistoryPanel id={inv.id} />}
    </div>
  );
}

function InvoiceHeader({ inv, onError, onDeleted }: { inv: Invoice; onError: (e: string | null) => void; onDeleted: () => void }) {
  const action = useInvoiceAction();
  const changePeriod = useChangeInvoicePeriod();
  const [decision, setDecision] = useState<null | "approve" | "reject" | "reopen">(null);
  const [comment, setComment] = useState("");
  const [editingDates, setEditingDates] = useState(false);
  const [from, setFrom] = useState(inv.periodFrom);
  const [to, setTo] = useState(inv.periodTo);
  const can = inv.can;

  async function run(kind: "refresh" | "paid" | "delete") {
    onError(null);
    if (kind === "delete" && !window.confirm("Delete this invoice?")) return;
    try {
      await action.mutateAsync({ id: inv.id, action: kind });
      if (kind === "delete") onDeleted();
    } catch (e) {
      onError(getErrorMessage(e));
    }
  }

  async function decide() {
    if (!decision) return;
    onError(null);
    if (decision !== "approve" && !comment.trim()) {
      onError(decision === "reject" ? "Add a reason so the person knows what to change." : "Add a reason for reopening.");
      return;
    }
    try {
      await action.mutateAsync({ id: inv.id, action: decision, comment: comment.trim() || undefined });
      setDecision(null);
      setComment("");
    } catch (e) {
      onError(getErrorMessage(e));
    }
  }

  async function saveDates() {
    onError(null);
    try {
      await changePeriod.mutateAsync({ id: inv.id, from, to });
      setEditingDates(false);
    } catch (e) {
      onError(getErrorMessage(e));
    }
  }

  const busy = action.isPending || changePeriod.isPending;
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-on-surface">
            <FileText size={18} /> {inv.number}
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_TONE[inv.status])}>
              {STATUS_LABELS[inv.status]}
            </span>
            {inv.version > 0 && <span className="text-xs font-normal text-grey-500">version {inv.version}</span>}
          </h2>
          <p className="text-sm text-grey-600">
            {inv.personName} · {dayText(inv.periodFrom)} → {dayText(inv.periodTo)}
          </p>
          <p className="mt-1 text-xl font-bold text-ink">{formatMoney(inv.totalAmount)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can.refresh && (
            <button type="button" disabled={busy} onClick={() => run("refresh")}
              className={`${button} inline-flex items-center gap-1 border border-grey-300 text-ink hover:bg-grey-50`}
              title="Rebuild the hours records for this period">
              <RefreshCw size={14} /> Refresh hours
            </button>
          )}
          {can.changePeriod && (
            <button type="button" disabled={busy} onClick={() => setEditingDates((v) => !v)}
              className={`${button} border border-grey-300 text-ink hover:bg-grey-50`}>Change dates</button>
          )}
          {can.approve && (
            <button type="button" disabled={busy} onClick={() => setDecision("approve")}
              className={`${button} bg-primary text-white hover:opacity-90`}>Approve</button>
          )}
          {can.reject && (
            <button type="button" disabled={busy} onClick={() => setDecision("reject")}
              className={`${button} border border-grey-300 text-error hover:bg-grey-50`}>Return for changes</button>
          )}
          {can.markPaid && (
            <button type="button" disabled={busy} onClick={() => run("paid")}
              className={`${button} bg-primary text-white hover:opacity-90`}>Mark paid</button>
          )}
          {can.reopen && (
            <button type="button" disabled={busy} onClick={() => setDecision("reopen")}
              className={`${button} border border-grey-300 text-ink hover:bg-grey-50`}>Reopen</button>
          )}
          {can.delete && (
            <button type="button" disabled={busy} onClick={() => run("delete")}
              className={`${button} border border-grey-300 text-error hover:bg-grey-50`}>Delete</button>
          )}
          <a href={`/api/invoices/${inv.id}/export/xlsx`} className={`${button} inline-flex items-center gap-1 border border-grey-300 text-ink hover:bg-grey-50`}>
            <Download size={14} /> Excel
          </a>
          <a href={`/api/invoices/${inv.id}/export/pdf`} className={`${button} inline-flex items-center gap-1 border border-grey-300 text-ink hover:bg-grey-50`}>
            <Download size={14} /> PDF
          </a>
        </div>
      </div>

      {editingDates && (
        <div className="flex flex-wrap items-end gap-2 border-t border-grey-100 pt-3">
          <label className="flex flex-col gap-1 text-xs text-grey-600">
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={input} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-grey-600">
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={input} />
          </label>
          <button type="button" disabled={busy} onClick={saveDates} className={`${button} bg-primary text-white`}>Save dates</button>
          <p className="w-full text-xs text-grey-500">Changing dates refreshes the lines and reopens completed parts.</p>
        </div>
      )}

      {decision && (
        <div className="flex flex-col gap-2 border-t border-grey-100 pt-3">
          <label className="flex flex-col gap-1 text-xs text-grey-600">
            {decision === "approve" ? "Comment (optional)" : decision === "reject" ? "What needs changing?" : "Why reopen?"}
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} maxLength={2000}
              className="rounded-lg border border-grey-300 p-2 text-sm text-on-surface" />
          </label>
          {decision === "approve" && (
            <p className="text-xs text-grey-500">
              Approving saves every line&apos;s final hours to the hours records and locks them to this invoice.
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={decide}
              className={cn(button, decision === "reject" ? "bg-error text-white" : "bg-primary text-white")}>
              {decision === "approve" ? "Confirm approval" : decision === "reject" ? "Return to person" : "Reopen invoice"}
            </button>
            <button type="button" onClick={() => setDecision(null)} className={`${button} border border-grey-300 text-ink`}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}

function StatusBanner({ inv }: { inv: Invoice }) {
  const messages: { tone: "error" | "warn" | "info" | "ok"; text: string }[] = [];
  if (inv.status === "REJECTED" && inv.rejectionReason) {
    messages.push({
      tone: "error",
      text: `Returned for changes: ${inv.rejectionReason}${inv.can.ownerEdit ? " — edit the lines and complete again, or resubmit as is." : ""}`,
    });
  }
  if (inv.status === "PENDING" && inv.can.ownerEdit === false && !inv.can.managerEdit) {
    messages.push({ tone: "info", text: "Waiting for approval by management." });
  }
  if (inv.status === "APPROVED" || inv.status === "PAID") {
    messages.push({ tone: "ok", text: `Final invoice — approved ${dateTimeText(inv.approvedAt)}${inv.paidAt ? `, paid ${dateTimeText(inv.paidAt)}` : ""}. These hours are saved and locked.` });
  }
  if (inv.problemLines > 0) {
    messages.push({ tone: "error", text: `${inv.problemLines} line(s) can't be priced because a rate, agreed hours, allocation or purchase price is missing. See the red lines.` });
  }
  if (inv.awaitingReviewLines > 0 && inv.status !== "APPROVED" && inv.status !== "PAID") {
    messages.push({
      tone: "warn",
      text: inv.can.managerEdit
        ? `${inv.awaitingReviewLines} day(s) under review have no hours yet. Set their final hours before approving, or return the invoice.`
        : `${inv.awaitingReviewLines} day(s) are under review (below the minimum working period or no attendance). Enter the hours you worked in the highlighted Final hours cells.`,
    });
  }
  for (const p of inv.pendingPurchases) messages.push({ tone: "info", text: p });
  if (messages.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {messages.map((m) => (
        <p key={m.text} className={cn("rounded-xl px-3 py-2 text-sm",
          m.tone === "error" && "bg-error/10 text-error",
          m.tone === "warn" && "bg-status-pending/10 text-status-pending",
          m.tone === "info" && "bg-grey-100 text-grey-700",
          m.tone === "ok" && "bg-success/10 text-success")}>
          {m.text}
        </p>
      ))}
    </div>
  );
}

function PartSection({ inv, part, isLast, onError, onNext }: {
  inv: Invoice;
  part: InvoicePart;
  isLast: boolean;
  onError: (e: string | null) => void;
  onNext?: () => void;
}) {
  const partAction = useInvoicePart();
  const action = useInvoiceAction();
  const lines = useMemo(() => inv.lines.filter((l) => l.role === part.role), [inv.lines, part.role]);
  const sections = useMemo(() => groupLines(lines), [lines]);
  // Management sees what the person entered next to the final value; the person only sees the final column.
  const showPerson = inv.can.viewHistory;
  const cols = showPerson ? 7 : 6;

  async function complete() {
    onError(null);
    try {
      await partAction.mutateAsync({ id: inv.id, role: part.role, action: "complete" });
      if (!isLast && onNext) onNext();
    } catch (e) {
      onError(getErrorMessage(e));
    }
  }

  async function reopen() {
    onError(null);
    try {
      await partAction.mutateAsync({ id: inv.id, role: part.role, action: "reopen" });
    } catch (e) {
      onError(getErrorMessage(e));
    }
  }

  async function submit() {
    onError(null);
    try {
      await action.mutateAsync({ id: inv.id, action: "submit" });
    } catch (e) {
      onError(getErrorMessage(e));
    }
  }

  return (
    <section className="overflow-x-auto rounded-2xl bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grey-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-on-surface">{part.label} part</h3>
          <p className="text-xs text-grey-500">
            {part.lineCount} line(s) · {formatMoney(part.total)}
            {part.awaitingReview > 0 ? ` · ${part.awaitingReview} day(s) need hours` : ""}
            {part.completed && part.completedAt ? ` · completed ${dateTimeText(part.completedAt)}` : ""}
          </p>
        </div>
        {inv.can.completeParts && (
          <div className="flex gap-2">
            {part.completed ? (
              <>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-success"><CheckCircle2 size={16} /> Completed</span>
                <button type="button" disabled={partAction.isPending} onClick={reopen}
                  className={`${button} border border-grey-300 text-ink hover:bg-grey-50`}>Reopen part</button>
              </>
            ) : (
              <button type="button" disabled={partAction.isPending} onClick={complete}
                className={`${button} bg-primary text-white hover:opacity-90`}>
                {isLast ? `Complete ${part.label.toLowerCase()} part & submit` : `Complete ${part.label.toLowerCase()} part`}
              </button>
            )}
            {inv.can.submit && (
              <button type="button" disabled={action.isPending} onClick={submit}
                className={`${button} bg-primary text-white hover:opacity-90`}>
                {inv.status === "REJECTED" ? "Resubmit" : "Submit"}
              </button>
            )}
          </div>
        )}
      </div>
      {inv.can.ownerEdit && (
        <p className="border-b border-grey-100 px-4 py-2 text-xs text-grey-500">
          Final hours are filled with your agreed hours. Highlighted days are under review — enter the hours you worked.
          Change any other day only if it differs.
        </p>
      )}
      {lines.length === 0 ? (
        <p className="py-10 text-center text-sm text-grey-500">No {part.label.toLowerCase()} hours in this period.</p>
      ) : (
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-grey-200 bg-grey-50 text-xs uppercase text-grey-500">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Details</th>
              <th className="px-3 py-2 text-right">Actual h</th>
              <th className="px-3 py-2 text-right">Agreed h</th>
              {showPerson && <th className="px-3 py-2 text-right" title="What the cleaner/supervisor entered">{part.label} h</th>}
              <th className="px-3 py-2 text-right">Final</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => (
              <Fragment key={s.section}>
                <tr className="border-t border-grey-200 bg-grey-100/70">
                  <td colSpan={cols - 1} className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-ink">
                    {SECTION_LABELS[s.section]}
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-bold text-ink">{formatMoney(s.total)}</td>
                </tr>
                {s.sites.map((g) => (
                  <Fragment key={`${s.section}-${g.site}`}>
                    {s.section !== "HAND_CARRY" && (
                      <SiteHeader inv={inv} site={g.site} lines={g.lines} cols={cols} onError={onError} />
                    )}
                    {g.lines.map((l) => (
                      <LineRow key={l.id} inv={inv} line={l} showPerson={showPerson} onError={onError} />
                    ))}
                  </Fragment>
                ))}
              </Fragment>
            ))}
            <tr className="border-t-2 border-grey-300">
              <td colSpan={cols - 1} className="px-3 py-3 text-right font-semibold">{part.label} total</td>
              <td className="px-3 py-3 text-right text-base font-bold">{formatMoney(part.total)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </section>
  );
}

/** Site sub-heading: rate once per site (management can change it for every day of the site at once). */
function SiteHeader({ inv, site, lines, cols, onError }: {
  inv: Invoice;
  site: string;
  lines: InvoiceLine[];
  cols: number;
  onError: (e: string | null) => void;
}) {
  const bulk = useEditInvoiceLines();
  const [rate, setRate] = useState<string | null>(null);
  const summary = rateSummary(lines);
  const hourly = lines.filter((l) => l.rateType !== "TOTAL");
  const finalHours = hourly.reduce((a, l) => a + l.finalMinutes, 0);
  const subtotal = lines.reduce((a, l) => a + (l.amount ?? 0), 0);

  async function apply() {
    if (rate == null) return;
    const n = Number(rate);
    if (!Number.isFinite(n) || n < 0) {
      onError("Enter a valid rate.");
      return;
    }
    onError(null);
    try {
      await bulk.mutateAsync({ id: inv.id, edits: hourly.map((l) => ({ lineId: l.id, rate: n })) });
      setRate(null);
    } catch (e) {
      onError(getErrorMessage(e));
    }
  }

  return (
    <tr className="border-t border-grey-100 bg-grey-50/60">
      <td colSpan={cols - 1} className="px-3 py-1.5 text-xs text-grey-700">
        <span className="font-semibold text-on-surface">{site}</span>
        {summary && <span className="ml-2">· {summary}</span>}
        {hourly.length > 0 && <span className="ml-2">· {hoursText(finalHours)} h</span>}
        {inv.can.managerEdit && hourly.length > 0 && (
          rate == null ? (
            <button type="button" onClick={() => setRate(String(hourly[0]?.finalRate ?? ""))}
              className="ml-2 text-primary hover:underline">change rate</button>
          ) : (
            <span className="ml-2 inline-flex items-center gap-1">
              <input type="number" min={0} step="0.01" value={rate} onChange={(e) => setRate(e.target.value)}
                className="h-7 w-24 rounded-md border border-grey-300 px-2 text-right text-xs" aria-label={`Rate for ${site}`} />
              <button type="button" disabled={bulk.isPending} onClick={apply} className="font-semibold text-primary">apply to all days</button>
              <button type="button" onClick={() => setRate(null)} className="text-grey-500">cancel</button>
            </span>
          )
        )}
      </td>
      <td className="px-3 py-1.5 text-right text-xs font-semibold text-grey-700">{formatMoney(subtotal)}</td>
    </tr>
  );
}

function LineRow({ inv, line, showPerson, onError }: {
  inv: Invoice;
  line: InvoiceLine;
  showPerson: boolean;
  onError: (e: string | null) => void;
}) {
  const edit = useEditInvoiceLine();
  const manager = inv.can.managerEdit;
  const total = line.rateType === "TOTAL";
  const purchase = line.section === "HAND_CARRY";
  const finalValue = line.missingHours ? "" : total ? (line.amount ?? 0).toFixed(2) : (line.finalMinutes / 60).toFixed(2);
  const [value, setValue] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const currentNote = manager ? line.adminNote : line.note;

  async function save(patch: { finalMinutes?: number; finalAmount?: number; note?: string; reset?: boolean }) {
    onError(null);
    try {
      await edit.mutateAsync({ id: inv.id, lineId: line.id, ...patch });
      setValue(null);
      setNote(null);
      setNoteOpen(false);
    } catch (e) {
      onError(getErrorMessage(e));
    }
  }

  function saveValue() {
    if (value == null || value === finalValue || (value === "" && line.missingHours)) return setValue(null);
    const n = Number(value);
    if (value === "" || !Number.isFinite(n) || n < 0 || (!total && n > 24)) {
      onError(total ? "Enter a valid amount." : "Enter hours between 0 and 24.");
      return;
    }
    void save(total ? { finalAmount: n } : { finalMinutes: Math.round(n * 60) });
  }

  const overridden = manager ? line.approvedMinutes != null || line.approvedAmount != null || line.approvedRate != null
    : line.claimedMinutes != null || line.claimedAmount != null;
  const description = line.description && !REDUNDANT_DESCRIPTIONS.has(line.description) ? line.description : null;
  const personValue = total ? formatMoney(line.personAmount) : line.personMinutes != null ? hoursText(line.personMinutes) : "—";

  return (
    <tr className={cn("border-t border-grey-100 align-top", line.problem && "bg-error/5",
      line.missingHours && !line.problem && "bg-status-pending/10",
      line.needsReview && !line.missingHours && !line.problem && "bg-status-pending/5")}>
      <td className="whitespace-nowrap px-3 py-2 text-grey-700">{dayText(line.lineDate)}</td>
      <td className="px-3 py-2">
        {description && (
          <span className="block">
            {line.poId && !purchase ? `PO ${line.poId} · ` : ""}
            {description}
            {purchase && line.siteName ? ` → ${line.siteName}` : ""}
          </span>
        )}
        {purchase && line.items.length > 0 && <PurchaseItems items={line.items} />}
        {line.problem ? (
          <span className="flex items-start gap-1 text-[11px] text-error"><AlertTriangle size={12} className="mt-0.5 shrink-0" /> {line.problem}</span>
        ) : line.needsReview ? (
          <span className="flex items-start gap-1 text-[11px] text-status-pending"><AlertTriangle size={12} className="mt-0.5 shrink-0" /> {line.lockReason}</span>
        ) : line.locked && line.lockReason ? (
          <span className="flex items-center gap-1 text-[11px] text-grey-500"><Lock size={11} /> {line.lockReason}</span>
        ) : null}
        {line.note && <span className="block text-[11px] text-grey-600">Note: {line.note}</span>}
        {line.adminNote && <span className="block text-[11px] text-grey-600">Management: {line.adminNote}</span>}
        {line.editable && (noteOpen ? (
          <input
            autoFocus
            value={note ?? currentNote ?? ""}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => (note != null && note !== (currentNote ?? "") ? save({ note }) : setNoteOpen(false))}
            placeholder={manager ? "Management note…" : "Note…"}
            maxLength={500}
            className="mt-1 h-7 w-full max-w-xs rounded-md border border-grey-200 px-2 text-xs"
            aria-label="Line note"
          />
        ) : (
          <button type="button" onClick={() => setNoteOpen(true)} className="text-[11px] text-primary hover:underline">
            {currentNote ? "edit note" : "add note"}
          </button>
        ))}
      </td>
      <td className="px-3 py-2 text-right text-grey-700">{total ? "—" : hoursText(line.actualMinutes)}</td>
      <td className="px-3 py-2 text-right text-grey-700">{total ? "—" : hoursText(line.agreedMinutes)}</td>
      {showPerson && <td className="px-3 py-2 text-right text-grey-700">{purchase ? "—" : personValue}</td>}
      <td className="px-3 py-2 text-right font-medium">
        {line.editable ? (
          <input
            type="number"
            min={0}
            max={total ? undefined : 24}
            step={total ? "0.01" : "0.25"}
            value={value ?? finalValue}
            placeholder={line.missingHours ? "hours" : undefined}
            onChange={(e) => setValue(e.target.value)}
            onBlur={saveValue}
            className={cn("h-8 w-24 rounded-lg border px-2 text-right text-sm",
              line.missingHours ? "border-status-pending bg-white" : "border-grey-300")}
            aria-label={total ? "Final amount" : "Final hours"}
          />
        ) : total ? (
          formatMoney(line.amount)
        ) : (
          hoursText(line.finalMinutes)
        )}
        {total && line.editable && <span className="block text-[10px] text-grey-500">amount ($)</span>}
        {overridden && line.editable && (
          <button type="button" onClick={() => save({ reset: true })} className="block w-full text-right text-[10px] text-primary hover:underline">
            reset
          </button>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">
        {formatMoney(line.amount)}
        {line.multiplier != null && line.multiplier !== 1 && (
          <span className="block text-[10px] font-normal text-grey-500">×{line.multiplier} weekend/holiday</span>
        )}
        {line.approvedRate != null && (
          <span className="block text-[10px] font-normal text-grey-500">@ {formatMoney(line.approvedRate)} (changed)</span>
        )}
      </td>
    </tr>
  );
}

/** Item rows of a hand-carry purchase: "name | qty | unit price | amount". */
function PurchaseItems({ items }: { items: string[] }) {
  return (
    <table className="my-1 w-full max-w-md text-[11px] text-grey-700">
      <tbody>
        {items.map((row, i) => {
          const [name, qty, price, amount] = row.split(" | ");
          return (
            <tr key={i}>
              <td className="pr-2">{name}</td>
              <td className="pr-2 text-right">{qty}</td>
              <td className="pr-2 text-right">{price && /^[0-9.]+$/.test(price) ? `@ $${price}` : price}</td>
              <td className="text-right">{amount ? `$${amount}` : ""}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function NotesCard({ inv, onError }: { inv: Invoice; onError: (e: string | null) => void }) {
  const saveNotes = useSaveInvoiceNotes();
  const [notes, setNotes] = useState<string | null>(null);
  const editable = inv.can.ownerEdit || inv.can.managerEdit;
  if (!editable && !inv.notes) return null;
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <label className="flex flex-col gap-1 text-xs text-grey-600">
        Notes
        <textarea
          value={notes ?? inv.notes ?? ""}
          onChange={(e) => setNotes(e.target.value)}
          readOnly={!editable}
          maxLength={2000}
          rows={3}
          className="rounded-lg border border-grey-300 p-2 text-sm text-on-surface"
        />
      </label>
      {notes != null && editable && (
        <button type="button" disabled={saveNotes.isPending}
          onClick={async () => {
            try {
              await saveNotes.mutateAsync({ id: inv.id, notes });
              setNotes(null);
            } catch (e) {
              onError(getErrorMessage(e));
            }
          }}
          className="mt-2 rounded-full border border-grey-300 px-4 py-1.5 text-sm font-semibold text-ink hover:bg-grey-50 disabled:opacity-50">
          Save notes
        </button>
      )}
    </section>
  );
}
