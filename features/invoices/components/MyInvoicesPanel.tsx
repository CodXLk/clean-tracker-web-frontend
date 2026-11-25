"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { toLocalDateString } from "@/features/tasks/lib/task-utils";
import { useCreateInvoice, useInvoiceAccess, useMyInvoices } from "@/features/invoices/hooks/useInvoices";
import { InvoiceEditor } from "@/features/invoices/components/InvoiceEditor";
import { InvoiceTable } from "@/features/invoices/components/InvoiceTable";
import { DateInput } from "@/components/shared/DateInput";

const input = "h-9 rounded-lg border border-grey-300 bg-white px-2.5 text-sm text-on-surface";

/** A cleaner's/supervisor's own invoices (one invoice covers both roles). Opens ?id= directly. */
export function MyInvoicesPanel() {
  const params = useSearchParams();
  const router = useRouter();
  const access = useInvoiceAccess();
  const openId = params.get("id");
  const setOpenId = (id: string | null) => router.replace(id ? `/dashboard/invoices?id=${id}` : "/dashboard/invoices");

  if (access.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }
  if (!access.data?.eligible) {
    return <p className="rounded-2xl bg-white py-12 text-center text-sm text-grey-500 shadow-sm">Invoices aren&apos;t available for your account.</p>;
  }
  if (openId) return <InvoiceEditor id={openId} onBack={() => setOpenId(null)} backLabel="My invoices" />;
  return <MyList onOpen={setOpenId} roles={access.data.roles} />;
}

function MyList({ onOpen, roles }: { onOpen: (id: string) => void; roles: string[] }) {
  const { data: invoices = [], isLoading } = useMyInvoices();
  const create = useCreateInvoice();
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
    try {
      const inv = await create.mutateAsync({ from, to });
      onOpen(inv.id);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  const both = roles.includes("CLEANER") && roles.includes("SUPERVISOR");
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-on-surface">New invoice</h3>
        <p className="mb-3 text-xs text-grey-500">
          Choose the dates to invoice. Your general cleaning, cover and work order hours are filled in
          {both ? ", with a separate page for your supervision work" : ""}. Your draft is saved as you go — come back any
          time, then complete it to send it for approval. Dates can&apos;t overlap another invoice; overlapping one of your
          drafts adds the dates to it.
        </p>
        <div className="flex flex-wrap items-end gap-2">
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
      <InvoiceTable invoices={invoices} isLoading={isLoading} onOpen={onOpen} showPerson={false} empty="You have no invoices yet." />
    </div>
  );
}
