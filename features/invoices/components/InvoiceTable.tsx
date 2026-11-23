"use client";

import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { STATUS_LABELS, STATUS_TONE, formatMoney, type Invoice } from "@/features/invoices/hooks/useInvoices";
import { dateTimeText, dayText } from "@/features/invoices/lib/format";
import { cn } from "@/lib/utils/cn";

/** Invoice list rows (management sees the person column). */
export function InvoiceTable({ invoices, isLoading, onOpen, showPerson, empty }: {
  invoices: Invoice[];
  isLoading: boolean;
  onOpen: (id: string) => void;
  showPerson: boolean;
  empty: string;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center rounded-2xl bg-white py-12 shadow-sm">
        <LoadingSpinner />
      </div>
    );
  }
  if (invoices.length === 0) {
    return <p className="rounded-2xl bg-white py-12 text-center text-sm text-grey-500 shadow-sm">{empty}</p>;
  }
  return (
    <section className="overflow-x-auto rounded-2xl bg-white shadow-sm">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="border-b border-grey-200 bg-grey-50 text-xs uppercase text-grey-500">
          <tr>
            <th className="px-4 py-3">Number</th>
            {showPerson && <th className="px-4 py-3">Person</th>}
            <th className="px-4 py-3">Period</th>
            <th className="px-4 py-3">Roles</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Updated</th>
            <th className="px-4 py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-grey-100">
          {invoices.map((i) => (
            <tr key={i.id} className="cursor-pointer hover:bg-grey-50" onClick={() => onOpen(i.id)}>
              <td className="px-4 py-3 font-medium text-ink">
                {i.number}
                {i.version > 0 && <span className="ml-1 text-xs text-grey-500">v{i.version}</span>}
              </td>
              {showPerson && <td className="px-4 py-3">{i.personName}</td>}
              <td className="px-4 py-3">
                {dayText(i.periodFrom)} → {dayText(i.periodTo)}
              </td>
              <td className="px-4 py-3 text-xs text-grey-600">
                {i.parts.map((p) => `${p.label}${p.completed ? " ✓" : ""}`).join(" · ") || "—"}
              </td>
              <td className="px-4 py-3">
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_TONE[i.status])}>
                  {STATUS_LABELS[i.status]}
                </span>
                {i.awaitingReviewLines > 0 && i.status !== "APPROVED" && i.status !== "PAID" && (
                  <span className="ml-1 text-[11px] text-status-pending">{i.awaitingReviewLines} awaiting review</span>
                )}
                {i.problemLines > 0 && <span className="ml-1 text-[11px] text-error">{i.problemLines} setup missing</span>}
              </td>
              <td className="px-4 py-3 text-xs text-grey-600">{dateTimeText(i.updatedAt ?? i.createdAt)}</td>
              <td className="px-4 py-3 text-right font-semibold">{formatMoney(i.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
