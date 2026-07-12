"use client";

import { CalendarDays, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface InvoicesModalProps {
  open:    boolean;
  onClose: () => void;
}

interface InvoiceEntry {
  id:         string;
  dateRange:  string;
  hours:      number;
  rate:       number;
  amount:     string;
  status:     "Paid" | "Pending";
}

const INVOICE_HISTORY: InvoiceEntry[] = [
  { id: "1", dateRange: "Apr 1 – Apr 15, 2026",  hours: 80,  rate: 15, amount: "$1,200.00", status: "Paid" },
  { id: "2", dateRange: "Mar 16 – Mar 31, 2026", hours: 76,  rate: 15, amount: "$1,140.00", status: "Paid" },
  { id: "3", dateRange: "Mar 1 – Mar 15, 2026",  hours: 72,  rate: 15, amount: "$1,080.00", status: "Paid" },
];

const TOTAL_HOURS    = 1856;
const MAX_HOURS      = 2000;
const PROGRESS_PCT   = Math.min((TOTAL_HOURS / MAX_HOURS) * 100, 100);

export function InvoicesModal({ open, onClose }: InvoicesModalProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Invoices"
        className={cn(
          "fixed z-50 bg-white p-6",
          "inset-x-0 bottom-0 rounded-t-3xl max-h-[85vh] overflow-y-auto",
          "lg:inset-0 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-md lg:rounded-3xl lg:shadow-2xl",
        )}
      >
        {/* Close */}
        <div className="mb-5 flex justify-end">
          <button
            onClick={onClose}
            aria-label="Close invoices"
            className="rounded-full p-0.5 text-danger transition-colors hover:bg-danger/10"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Current Period card */}
        <div className="mb-6 rounded-2xl bg-grey-100 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <CalendarDays size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">Current Period</p>
              <p className="text-xs text-grey-500">Apr 16 – Apr 30, 2026</p>
            </div>
          </div>

          {/* Hours worked */}
          <div className="mb-3">
            <div className="mb-1 flex justify-between text-xs text-grey-700">
              <span>Hours Worked</span>
              <span className="font-semibold">{TOTAL_HOURS} / {MAX_HOURS} hrs</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-grey-300">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${PROGRESS_PCT}%` }}
                aria-valuenow={TOTAL_HOURS}
                aria-valuemax={MAX_HOURS}
                role="progressbar"
              />
            </div>
          </div>

          {/* Estimated earnings */}
          <div className="flex justify-between text-sm">
            <span className="text-grey-700">Estimated Earnings</span>
            <span className="font-bold text-[#ED5F25]">$1,200.00</span>
          </div>
        </div>

        {/* Invoice History */}
        <h3 className="mb-3 text-base font-bold text-on-surface">Invoice History</h3>
        <div className="flex flex-col">
          {INVOICE_HISTORY.map((inv, idx) => (
            <div key={inv.id}>
              <div className="flex items-center justify-between py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-on-surface">{inv.dateRange}</span>
                  <span className="text-xs text-grey-500">
                    {inv.hours} hrs × ${inv.rate}/hr
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-xl border border-primary px-2.5 py-0.5 text-xs font-medium text-primary">
                      {inv.status}
                    </span>
                    <ChevronDown size={16} className="text-grey-500" />
                  </div>
                  <span className="text-sm font-bold text-[#ED5F25]">{inv.amount}</span>
                </div>
              </div>
              {idx < INVOICE_HISTORY.length - 1 && (
                <hr className="border-grey-300" />
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
