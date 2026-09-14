"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useIsDrawerNav } from "@/components/layout/AppNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { ClientCompanyManagement } from "@/features/user-management/components/ClientCompanyManagement";
import { ClientManagement } from "@/features/user-management/components/ClientManagement";
import { cn } from "@/lib/utils/cn";

const TABS = ["Client Companies", "Client Contacts"] as const;
type Tab = (typeof TABS)[number];

/** URL-friendly slug per tab, so the selection survives refreshes and can be linked. */
const TAB_SLUG: Record<Tab, string> = {
  "Client Companies": "companies",
  "Client Contacts": "contacts",
};
const SLUG_TAB: Record<string, Tab> = {
  companies: "Client Companies",
  contacts: "Client Contacts",
};

function ClientsContent() {
  const useDrawerNav = useIsDrawerNav();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL is the source of truth; fall back to the first tab for unknown values.
  const requested = SLUG_TAB[searchParams.get("tab") ?? ""] ?? "Client Companies";
  const tab: Tab = TABS.includes(requested) ? requested : "Client Companies";

  function setTab(next: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", TAB_SLUG[next]);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <>
      {!useDrawerNav && (
        <div className="lg:hidden">
          <PageHeader title="Clients" />
        </div>
      )}

      <div className={cn("px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8", !useDrawerNav ? "pb-28 lg:pb-8" : "pb-6 lg:pb-8")}>
        <div className="mx-auto max-w-7xl">
          {/* Table-header style section switcher */}
          <div className="mb-6">
            <SegmentedTabs<Tab> options={[...TABS]} value={tab} onChange={setTab} />
          </div>

          {tab === "Client Companies" && <ClientCompanyManagement />}
          {tab === "Client Contacts" && <ClientManagement />}
        </div>
      </div>
    </>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={null}>
      <ClientsContent />
    </Suspense>
  );
}
