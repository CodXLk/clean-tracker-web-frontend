"use client";

import { Receipt } from "lucide-react";
import { useIsDrawerNav } from "@/components/layout/AppNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils/cn";

/** Client portal invoices — placeholder until client invoicing is built (separate from staff invoices). */
export default function ClientInvoicesPage() {
  const useDrawerNav = useIsDrawerNav();
  return (
    <>
      {!useDrawerNav && (
        <div className="lg:hidden">
          <PageHeader title="Invoices" />
        </div>
      )}
      <div className={cn("px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8", !useDrawerNav ? "pb-28 lg:pb-8" : "pb-6 lg:pb-8")}>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 rounded-2xl bg-surface px-6 py-16 text-center shadow-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-ink">
            <Receipt size={22} aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-on-surface">Invoices</h2>
          <p className="max-w-md text-sm text-grey-500">
            Your invoices will appear here. We&apos;re getting this ready — check back soon.
          </p>
        </div>
      </div>
    </>
  );
}