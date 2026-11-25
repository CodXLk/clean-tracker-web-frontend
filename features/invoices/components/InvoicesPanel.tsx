"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { toLocalDateString } from "@/features/tasks/lib/task-utils";
import {
  STATUS_LABELS,
  useCreateInvoice,
  useInvoicePeople,
  useInvoices,
  type InvoiceStatus,
} from "@/features/invoices/hooks/useInvoices";
import { InvoiceEditor } from "@/features/invoices/components/InvoiceEditor";
import { InvoiceTable } from "@/features/invoices/components/InvoiceTable";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { DateInput } from "@/components/shared/DateInput";

const input = "h-9 rounded-lg border border-grey-300 bg-white px-2.5 text-sm text-on-surface";
const FILTERS: InvoiceStatus[] = ["PENDING", "DRAFT", "REJECTED", "APPROVED", "PAID"];

/** Management: every cleaner/supervisor invoice, filterable by status. Opens ?id= directly (notification links). */
export function InvoicesPanel() {
  const params = useSearchParams();
  const router = useRouter();
  const openId = params.get("id");
  const setOpenId = (id: string | null) => router.replace(id ? `/admin/invoices?id=${id}` : "/admin/invoices");
  if (openId) return <InvoiceEditor id={openId} onBack={() => setOpenId(null)} />;
  return <InvoiceList onOpen={setOpenId} />;
}

function InvoiceList({ onOpen }: { onOpen: (id: string) => void }) {
  const [status, setStatus] = useState<InvoiceStatus>("PENDING");
  const { data: invoices = [], isLoading } = useInvoices(status);
  return (
    <div className="flex flex-col gap-4">
      <FilterSelect<InvoiceStatus>
        options={FILTERS}
        value={status}
        onChange={setStatus}
        getLabel={(s) => STATUS_LABELS[s]}
      />
      <InvoiceTable invoices={invoices} isLoading={isLoading} onOpen={onOpen} showPerson
        empty={`No ${STATUS_LABELS[status].toLowerCase()} invoices.`} />
      <CreateOnBehalf onOpen={onOpen} />
    </div>
  );
}

function CreateOnBehalf({ onOpen }: { onOpen: (id: string) => void }) {
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

  async function submit() {
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
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-on-surface">Start a draft for someone</h3>
      <p className="mb-3 text-xs text-grey-500">
        Cleaners and supervisors normally create their own invoices. A draft started here is still completed and
        submitted by the person. Dates can&apos;t overlap another of their invoices; overlapping one of their drafts merges into it.
      </p>
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
          <DateInput value={from} onChange={(e) => setFrom(e.target.value)} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-grey-600">
          To
          <DateInput value={to} onChange={(e) => setTo(e.target.value)} className={input} />
        </label>
        <button type="button" onClick={submit} disabled={create.isPending}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
          {create.isPending ? "Creating…" : "Create draft"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </section>
  );
}
