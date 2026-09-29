"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useIsDrawerNav } from "@/components/layout/AppNav";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { PageHeader } from "@/components/shared/PageHeader";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { PersonScheduleTab } from "@/features/live-dashboard/components/PersonScheduleTab";
import { SiteScheduleTab } from "@/features/live-dashboard/components/SiteScheduleTab";
import { LiveLocationMapTab } from "@/features/live-dashboard/components/LiveLocationMapTab";
import { cn } from "@/lib/utils/cn";

const TABS = ["Overview", "Site Schedule", "Cleaners Schedule", "Supervisor Schedule", "Live Map"] as const;
type Tab = (typeof TABS)[number];

/** URL-friendly slug per tab, so the selection survives refreshes and can be linked. */
const TAB_SLUG: Record<Tab, string> = {
  Overview: "overview",
  "Site Schedule": "site-schedule",
  "Cleaners Schedule": "cleaners-schedule",
  "Supervisor Schedule": "supervisor-schedule",
  "Live Map": "map",
};
const SLUG_TAB: Record<string, Tab> = {
  overview: "Overview",
  "site-schedule": "Site Schedule",
  "cleaners-schedule": "Cleaners Schedule",
  "supervisor-schedule": "Supervisor Schedule",
  map: "Live Map",
};

function DashboardContent() {
  const useDrawerNav = useIsDrawerNav();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL is the source of truth; fall back to Overview for unknown tabs.
  const tab: Tab = SLUG_TAB[searchParams.get("tab") ?? ""] ?? "Overview";

  function setTab(next: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", TAB_SLUG[next]);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <>
      {!useDrawerNav && (
        <div className="lg:hidden">
          <PageHeader title="Dashboard" />
        </div>
      )}

      <div className={cn("px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8", !useDrawerNav ? "pb-28 lg:pb-8" : "pb-6 lg:pb-8")}>
        <div className="mx-auto max-w-7xl">
          {/* Table-header style section switcher */}
          <div className="mb-6">
            <SegmentedTabs<Tab> options={TABS} value={tab} onChange={setTab} />
          </div>

          {tab === "Overview" && <AdminDashboard />}
          {tab === "Site Schedule" && <SiteScheduleTab />}
          {tab === "Cleaners Schedule" && (
            <PersonScheduleTab audience="cleaners" initialPersonId={searchParams.get("cleaner") ?? undefined} />
          )}
          {tab === "Supervisor Schedule" && (
            <PersonScheduleTab audience="supervisors" initialPersonId={searchParams.get("supervisor") ?? undefined} />
          )}
          {tab === "Live Map" && <LiveLocationMapTab />}
        </div>
      </div>
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
