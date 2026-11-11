"use client";

import { useState } from "react";
import { InvoicesPanel } from "@/features/invoices/components/InvoicesPanel";
import { RatesPanel } from "@/features/invoices/components/RatesPanel";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { id: "invoices", label: "Invoices" },
  { id: "rates", label: "Rates & agreed hours" },
] as const;

export default function InvoicesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("invoices");
  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm text-grey-500">
          Invoices for in-house cleaners and supervisors from approved hours, with site rates and agreed hours.
        </p>
        <div className="mb-4 flex gap-2" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                tab === t.id ? "bg-primary text-white" : "bg-white text-grey-700 hover:bg-grey-100",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === "invoices" ? <InvoicesPanel /> : <RatesPanel />}
      </div>
    </div>
  );
}
