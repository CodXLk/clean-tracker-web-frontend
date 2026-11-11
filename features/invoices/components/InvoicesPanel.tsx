"use client";

import { Fragment, useMemo, useState } from "react";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { toLocalDateString } from "@/features/tasks/lib/task-utils";
import {
  SECTION_LABELS,
  formatMoney,
  useCreateInvoice,
  useEditInvoiceLine,
  useInvoice,
  useInvoiceAction,
  useInvoicePeople,
  useInvoices,
  useSaveInvoiceNotes,
  type Invoice,
  type InvoiceLine,
} from "@/features/invoices/hooks/useInvoices";
import { cn } from "@/lib/utils/cn";

const input = "h-9 rounded-lg border border-grey-300 bg-white px-2.5 text-sm text-on-surface";

const STATUS_TONE: Record<Invoice["status"], string> = {
  DRAFT: "bg-status-pending/10 text-status-pending",
  FINAL: "bg-primary/10 text-ink",
  PAID: "bg-success/10 text-success",
};

function hours(m?: number | null) {
  return m == null ? "—" : (m / 60).toFixed(2);
}

/** Invoice list, creation and the invoice editor. */
export function InvoicesPanel() {
  const [openId, setOpenId] = useState<string | null>(null);
  if (openId) return <InvoiceDetail id={openId} onBack={() => setOpenId(null)} />;
  return <InvoiceList onOpen={setOpenId} />;
}

function InvoiceList({ onOpen }: { onOpen: (id: string) => void }) {
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: people = [] } = useInvoicePeople();
  const create = useCreateInvoice();
  const [personUserId, setPersonUserId] = useState("");
  const [from, setFrom] = useState(() => {
    const d = new Date();
    return toLocalDateString(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  });
  const [to, setTo] = useState(() => {
    const d = new Date();
    return toLocalDateString(new Date(d.getFullYear(), d.getMonth(), 0));
  });
  const [error, setError] = useState<string | null>(null);

  async function createInvoice() {
    setError(null);
    if (!personUserId) {
      setError("Choose a cleaner or supervisor.");
      return;
    }
    try {
      const inv = await create.mutateAsync({ personUserId, from, to });
      onOpen(inv.id);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-on-surface">New invoice</h3>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-grey-600">
            Person
            <select value={personUserId} onChange={(e) => setPersonUserId(e.target.value)} className={`${input} min-w-[240px]`}>
              <option value="">Select cleaner or supervisor…</option>
              {people.map((p) => (
                <option key={p.userId} value={p.userId}>
                  {p.name} ({p.roles.map((r) => r.toLowerCase()).join(", ")})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-grey-600">
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={input} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-grey-600">
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={input} />
          </label>
          <button type="button" onClick={createInvoice} disabled={create.isPending}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {create.isPending ? "Creating…" : "Create draft"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-error">{error}</p>}
        <p className="mt-2 text-xs text-grey-500">
          Drafts use approved hours from the daily work record and approved work order hours. Every line must be
          approved before the invoice can be finalised.
        </p>
      </section>

      <section className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : invoices.length === 0 ? (
          <p className="py-12 text-center text-sm text-grey-500">No invoices yet.</p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-grey-200 bg-grey-50 text-xs uppercase text-grey-500">
              <tr>
                <th className="px-4 py-3">Number</th>
                <th className="px-4 py-3">Person</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-100">
              {invoices.map((i) => (
                <tr key={i.id} className="cursor-pointer hover:bg-grey-50" onClick={() => onOpen(i.id)}>
                  <td className="px-4 py-3 font-medium text-ink">{i.number}</td>
                  <td className="px-4 py-3">{i.personName}</td>
                  <td className="px-4 py-3">
                    {i.periodFrom} → {i.periodTo}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_TONE[i.status])}>{i.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatMoney(i.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function InvoiceDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { data: inv, isLoading, error: loadError } = useInvoice(id);
  const action = useInvoiceAction();
  const editLine = useEditInvoiceLine();
  const saveNotes = useSaveInvoiceNotes();
  const [rates, setRates] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => {
    const out = new Map<string, InvoiceLine[]>();
    for (const l of inv?.lines ?? []) {
      const key = l.section === "REGULAR_SITE" ? (l.siteName ?? SECTION_LABELS.REGULAR_SITE) : SECTION_LABELS[l.section];
      out.set(key, [...(out.get(key) ?? []), l]);
    }
    return [...out.entries()];
  }, [inv?.lines]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }
  if (!inv) return <p className="text-sm text-error">{getErrorMessage(loadError)}</p>;
  const draft = inv.status === "DRAFT";

  async function run(kind: "regenerate" | "finalize" | "paid" | "reopen" | "delete") {
    setError(null);
    if (kind === "delete" && !window.confirm("Delete this draft invoice?")) return;
    try {
      await action.mutateAsync({ id, action: kind });
      if (kind === "delete") onBack();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  async function saveRate(line: InvoiceLine) {
    const raw = rates[line.id];
    if (raw == null) return;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
      setError("Enter a valid rate.");
      return;
    }
    setError(null);
    try {
      await editLine.mutateAsync({ id, lineId: line.id, finalRate: value, note: line.note });
      setRates((p) => {
        const next = { ...p };
        delete next[line.id];
        return next;
      });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  const button = "rounded-full px-4 py-1.5 text-sm font-semibold disabled:opacity-50";

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="inline-flex w-fit items-center gap-1 text-sm text-grey-600 hover:text-ink">
        <ArrowLeft size={16} /> All invoices
      </button>
      <section className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-on-surface">
            <FileText size={18} /> {inv.number}
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_TONE[inv.status])}>{inv.status}</span>
          </h2>
          <p className="text-sm text-grey-600">
            {inv.personName} · {inv.periodFrom} → {inv.periodTo}
          </p>
          {inv.unapprovedLines > 0 && (
            <p className="mt-1 text-xs text-error">
              {inv.unapprovedLines} line(s) use hours that aren&apos;t approved yet. Approve them in Cleaner Logs → Hours
              review, then regenerate.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {draft && (
            <>
              <button type="button" disabled={action.isPending} onClick={() => run("regenerate")}
                className={`${button} border border-grey-300 text-ink hover:bg-grey-50`}>Regenerate</button>
              <button type="button" disabled={action.isPending || inv.unapprovedLines > 0} onClick={() => run("finalize")}
                className={`${button} bg-primary text-white hover:opacity-90`}>Finalise</button>
              <button type="button" disabled={action.isPending} onClick={() => run("delete")}
                className={`${button} border border-grey-300 text-error hover:bg-grey-50`}>Delete</button>
            </>
          )}
          {inv.status === "FINAL" && (
            <>
              <button type="button" disabled={action.isPending} onClick={() => run("paid")}
                className={`${button} bg-primary text-white hover:opacity-90`}>Mark paid</button>
              <button type="button" disabled={action.isPending} onClick={() => run("reopen")}
                className={`${button} border border-grey-300 text-ink hover:bg-grey-50`}>Back to draft</button>
            </>
          )}
          <a href={`/api/invoices/${id}/export/xlsx`} className={`${button} inline-flex items-center gap-1 border border-grey-300 text-ink hover:bg-grey-50`}>
            <Download size={14} /> Excel
          </a>
          <a href={`/api/invoices/${id}/export/pdf`} className={`${button} inline-flex items-center gap-1 border border-grey-300 text-ink hover:bg-grey-50`}>
            <Download size={14} /> PDF
          </a>
        </div>
      </section>
      {error && <p className="text-sm text-error">{error}</p>}

      <section className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        {inv.lines.length === 0 ? (
          <p className="py-12 text-center text-sm text-grey-500">No hours found for this period.</p>
        ) : (
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-grey-200 bg-grey-50 text-xs uppercase text-grey-500">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2 text-right">Actual h</th>
                <th className="px-3 py-2 text-right">Agreed h</th>
                <th className="px-3 py-2 text-right">Final h</th>
                <th className="px-3 py-2 text-right">Rate</th>
                <th className="px-3 py-2 text-right">×</th>
                <th className="px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(([title, lines]) => (
                <Fragment key={title}>
                  <tr className="bg-grey-50/60">
                    <td colSpan={7} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-grey-600">{title}</td>
                    <td className="px-3 py-2 text-right text-xs font-semibold text-grey-600">
                      {formatMoney(lines.reduce((a, l) => a + (l.amount ?? 0), 0))}
                    </td>
                  </tr>
                  {lines.map((l) => (
                    <tr key={l.id} className={cn("border-t border-grey-100", !l.approved && "bg-error/5")}>
                      <td className="px-3 py-2 text-grey-700">{l.lineDate ?? "—"}</td>
                      <td className="px-3 py-2">
                        {l.poId ? `PO ${l.poId} · ` : ""}
                        {l.description}
                        {l.section === "COVER" && l.siteName ? ` (${l.siteName})` : ""}
                        {!l.approved && <span className="ml-1 text-[11px] text-error">not approved</span>}
                      </td>
                      <td className="px-3 py-2 text-right">{hours(l.actualMinutes)}</td>
                      <td className="px-3 py-2 text-right">{hours(l.agreedMinutes)}</td>
                      <td className="px-3 py-2 text-right font-medium">{l.rateType === "TOTAL" ? "—" : hours(l.finalMinutes)}</td>
                      <td className="px-3 py-2 text-right">
                        {draft && l.rateType !== "TOTAL" ? (
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={rates[l.id] ?? (l.finalRate ?? "")}
                            onChange={(e) => setRates((p) => ({ ...p, [l.id]: e.target.value }))}
                            onBlur={() => saveRate(l)}
                            className="h-8 w-24 rounded-lg border border-grey-300 px-2 text-right text-sm"
                            aria-label="Final rate"
                          />
                        ) : (
                          formatMoney(l.finalRate)
                        )}
                        {l.rateType === "PER_VISIT" && <span className="block text-[10px] text-grey-500">per visit</span>}
                      </td>
                      <td className="px-3 py-2 text-right">{l.multiplier ?? 1}</td>
                      <td className="px-3 py-2 text-right font-semibold">{formatMoney(l.amount)}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
              <tr className="border-t-2 border-grey-300">
                <td colSpan={7} className="px-3 py-3 text-right font-semibold">Total</td>
                <td className="px-3 py-3 text-right text-base font-bold">{formatMoney(inv.totalAmount)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1 text-xs text-grey-600">
          Notes
          <textarea
            value={notes ?? inv.notes ?? ""}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            rows={3}
            className="rounded-lg border border-grey-300 p-2 text-sm text-on-surface"
          />
        </label>
        {notes != null && (
          <button type="button" disabled={saveNotes.isPending}
            onClick={async () => {
              try {
                await saveNotes.mutateAsync({ id, notes });
                setNotes(null);
              } catch (e) {
                setError(getErrorMessage(e));
              }
            }}
            className="mt-2 rounded-full border border-grey-300 px-4 py-1.5 text-sm font-semibold text-ink hover:bg-grey-50 disabled:opacity-50">
            Save notes
          </button>
        )}
      </section>
    </div>
  );
}
